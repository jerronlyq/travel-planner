import { searchPlaces, type GeocodeResult } from "@/lib/mapbox/geocode";
import { searchPhoton } from "@/lib/geo/photon";

/**
 * - region:  cities / countries (trip destination) — Mapbox only.
 * - poi:     named places (temples, hotels, restaurants…) — OpenStreetMap
 *            first, Mapbox as a filler for cities and streets.
 * - address: street addresses — Mapbox first, OpenStreetMap as a filler.
 */
export type SearchMode = "region" | "poi" | "address";

export type PlaceSearchOptions = {
  mode: SearchMode;
  country?: string | null;
  proximity?: string | null; // "lng,lat"
  signal?: AbortSignal;
};

const MAX_RESULTS = 6;
const OSM_TIMEOUT_MS = 7000;
const DUPLICATE_METRES = 80;

function metresBetween(a: GeocodeResult, b: GeocodeResult): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function normalise(name: string): string {
  return name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

// Same spot listed twice (OSM often tags one place several ways).
function isDuplicate(a: GeocodeResult, b: GeocodeResult): boolean {
  if (metresBetween(a, b) >= DUPLICATE_METRES) return false;
  const na = normalise(a.name);
  const nb = normalise(b.name);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function mergeUnique(
  primary: GeocodeResult[],
  secondary: GeocodeResult[],
  limit: number
): GeocodeResult[] {
  const out: GeocodeResult[] = [];
  for (const candidate of [...primary, ...secondary]) {
    if (out.length >= limit) break;
    if (out.some((o) => isDuplicate(o, candidate))) continue;
    out.push(candidate);
  }
  return out;
}

// A slow or failing OSM server must never block or break the search.
async function osmWithDeadline(
  query: string,
  opts: PlaceSearchOptions
): Promise<GeocodeResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OSM_TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  opts.signal?.addEventListener("abort", onOuterAbort);
  try {
    return await searchPhoton(query, {
      country: opts.country,
      proximity: opts.proximity,
      signal: controller.signal,
    });
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onOuterAbort);
  }
}

export async function searchPlacesForMode(
  query: string,
  opts: PlaceSearchOptions
): Promise<GeocodeResult[]> {
  if (query.trim().length < 3) return [];

  if (opts.mode === "region") {
    return searchPlaces(query, { signal: opts.signal });
  }

  const [mapbox, osm] = await Promise.all([
    searchPlaces(query, {
      country: opts.country,
      proximity: opts.proximity,
      signal: opts.signal,
    }),
    osmWithDeadline(query, opts),
  ]);

  if (opts.mode === "poi") {
    // Mapbox only pads the list (cities, streets) when OSM found little.
    const extras = osm.length === 0 ? 5 : osm.length < 3 ? 1 : 0;
    return mergeUnique(osm, mapbox.slice(0, extras), MAX_RESULTS);
  }
  return mergeUnique(mapbox.slice(0, 3), osm, MAX_RESULTS);
}

// "2-3-1 Asakusa, Taito City, Tokyo" -> also try without the house number,
// then with leading segments dropped — so an over-specific address still
// pins to the right neighbourhood instead of failing outright.
function relaxations(text: string): string[] {
  const parts = text
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const variants = [parts.join(", ")];
  if (parts.length > 0) {
    const withoutNumber = parts[0].replace(/^[\d\s\-–/#]+/, "").trim();
    variants.push([withoutNumber, ...parts.slice(1)].filter(Boolean).join(", "));
  }
  for (let i = 1; i <= parts.length - 2; i++) {
    variants.push(parts.slice(i).join(", "));
  }
  return [...new Set(variants)].filter((v) => v.length >= 3);
}

export type BestMatch = {
  result: GeocodeResult;
  // Index into the `texts` array that produced the match.
  textIndex: number;
  // True when only a simplified version of the text matched.
  approximate: boolean;
};

// Words that describe a *kind* of place rather than identify one.
const GENERIC_WORDS = new Set([
  "the", "and", "for", "near", "hotel", "hostel", "inn", "resort", "restaurant",
  "cafe", "coffee", "bar", "shop", "store", "museum", "temple", "shrine",
  "church", "station", "tower", "park", "garden", "street", "road", "avenue",
  "lane", "drive", "city", "town", "building", "floor", "level", "unit",
]);

function foldText(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function wordsOf(s: string): string[] {
  return foldText(s).match(/[\p{L}\p{N}]+/gu) ?? [];
}

function distinctiveTokens(query: string): string[] {
  return wordsOf(query).filter(
    (t) => t.length >= 3 && !/^\d+$/.test(t) && !GENERIC_WORDS.has(t)
  );
}

// Whole-word match ("fake" must not match "Fakenham"), also tolerating a
// word split by punctuation in the result ("Senso-ji" for "sensoji").
function hasWord(resultWords: string[], token: string): boolean {
  return resultWords.some(
    (w, i) => w === token || (i + 1 < resultWords.length && w + resultWords[i + 1] === token)
  );
}

/**
 * Auto-pinning guesses on the user's behalf, so it must not guess wildly:
 * the result has to be in the trip's country and contain most of the
 * distinctive words that were typed. (Picking from the dropdown is the
 * user's own choice and is never gated.)
 */
function isCredible(
  query: string,
  result: GeocodeResult,
  country?: string | null
): boolean {
  if (country && result.countryCode && result.countryCode !== country.toUpperCase()) {
    return false;
  }
  const tokens = distinctiveTokens(query);
  if (tokens.length === 0) return false;
  const resultWords = wordsOf(`${result.name} ${result.fullAddress}`);
  const matched = tokens.filter((t) => hasWord(resultWords, t)).length;
  return matched >= 1 && matched / tokens.length >= 0.5;
}

const NEARBY_METRES = 150_000;

// In the trip's country, or within ~150 km of the day's other stops.
function inKnownRegion(
  result: GeocodeResult,
  opts: Pick<PlaceSearchOptions, "country" | "proximity">
): boolean {
  if (opts.country && result.countryCode) {
    return result.countryCode === opts.country.toUpperCase();
  }
  if (opts.proximity) {
    const [lng, lat] = opts.proximity.split(",").map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return (
        metresBetween(result, { ...result, lat, lng }) < NEARBY_METRES
      );
    }
  }
  return false;
}

/**
 * Resolve free text to a single best guess — used when the user didn't pick
 * a suggestion. Tries each text in order (e.g. address first, then the
 * place name) with its own search mode, relaxing over-specific text, and
 * returns the first *credible* hit — or null rather than a wrong pin.
 */
export async function findBestMatch(
  texts: { text: string; mode: Exclude<SearchMode, "region"> }[],
  opts: Omit<PlaceSearchOptions, "mode">
): Promise<BestMatch | null> {
  for (let textIndex = 0; textIndex < texts.length; textIndex++) {
    const { text, mode } = texts[textIndex];
    const variants = relaxations(text);
    for (let v = 0; v < variants.length; v++) {
      const results = await searchPlacesForMode(variants[v], { ...opts, mode });
      const hit = results.find(
        (r) =>
          isCredible(variants[v], r, opts.country) &&
          // A simplified query is vague, so only trust it when we know
          // roughly where to look.
          (v === 0 || inKnownRegion(r, opts))
      );
      if (hit) return { result: hit, textIndex, approximate: v > 0 };
    }
  }
  return null;
}
