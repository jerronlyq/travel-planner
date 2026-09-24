import type { GeocodeResult } from "@/lib/mapbox/geocode";

// Photon — a free, keyless search-as-you-type geocoder over OpenStreetMap
// data (© OpenStreetMap contributors). It has far better coverage of points
// of interest (temples, hotels, restaurants, stations) than Mapbox's
// geocoder, and returns coordinates directly, so there is no second
// "retrieve" call and nothing counts against a Mapbox quota.
//
// The public instance is a fair-use service with no SLA — callers must
// tolerate failure (see search.ts, which falls back to Mapbox).

const ENDPOINT = "https://photon.komoot.io/api/";

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_type?: string;
    osm_id?: number;
    osm_key?: string;
    osm_value?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    locality?: string;
    district?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
  };
};

function dedupe(parts: (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const v = p?.trim();
    if (!v || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
  }
  return out;
}

function toResult(f: PhotonFeature): GeocodeResult | null {
  const p = f.properties;
  const [lng, lat] = f.geometry.coordinates;
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  const streetLine = [p.housenumber, p.street].filter(Boolean).join(" ");
  const name = p.name ?? (streetLine || p.district || p.city || "");
  if (!name) return null;

  // The address excludes the place's own name — that's already shown as the
  // title, and it would otherwise be copied into the Address field.
  const addressParts = dedupe([
    streetLine,
    p.district ?? p.locality,
    p.city,
    p.state,
    p.postcode,
    p.country,
  ]);
  const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : name;

  return {
    id: `osm-${p.osm_type ?? "x"}${p.osm_id ?? `${lat},${lng}`}-${p.osm_key ?? ""}-${p.osm_value ?? ""}`,
    name,
    fullAddress,
    lat,
    lng,
    countryCode: p.countrycode?.toUpperCase() ?? null,
    countryName: p.country ?? null,
    kind: p.osm_value ? p.osm_value.replace(/_/g, " ") : null,
    source: "osm",
  };
}

export async function searchPhoton(
  query: string,
  options: {
    country?: string | null; // ISO alpha-2, applied as a client-side filter
    proximity?: string | null; // "lng,lat" bias
    signal?: AbortSignal;
  } = {}
): Promise<GeocodeResult[]> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("lang", "en");
  // Over-fetch: the country filter below discards out-of-country hits.
  url.searchParams.set("limit", options.country ? "12" : "6");

  if (options.proximity) {
    const [lng, lat] = options.proximity.split(",");
    if (lat && lng) {
      url.searchParams.set("lat", lat);
      url.searchParams.set("lon", lng);
    }
  }

  const res = await fetch(url.toString(), { signal: options.signal });
  if (!res.ok) throw new Error(`Photon returned ${res.status}`);

  const data = (await res.json()) as { features?: PhotonFeature[] };
  let results = (data.features ?? [])
    .map(toResult)
    .filter((r): r is GeocodeResult => r !== null);

  if (options.country) {
    const cc = options.country.toUpperCase();
    const inCountry = results.filter((r) => r.countryCode === cc);
    // Only narrow when something matches; otherwise show what we found.
    if (inCountry.length > 0) results = inCountry;
  }

  return results.slice(0, 6);
}
