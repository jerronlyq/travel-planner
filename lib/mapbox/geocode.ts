export type GeocodeResult = {
  id: string;
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
};

type MapboxFeature = {
  properties: {
    mapbox_id?: string;
    name: string;
    full_address?: string;
    place_formatted?: string;
    coordinates: { longitude: number; latitude: number };
  };
};

export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    console.warn(
      "[geocode] NEXT_PUBLIC_MAPBOX_TOKEN is not set — restart `next dev` after adding it to .env.local"
    );
    return [];
  }
  if (!query.trim()) return [];

  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", query);
  url.searchParams.set("access_token", token);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "5");

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch (err) {
    console.error("[geocode] request failed", err);
    return [];
  }

  if (!res.ok) {
    console.error(
      `[geocode] Mapbox returned ${res.status}: ${await res.text().catch(() => "")}`
    );
    return [];
  }

  const data = (await res.json()) as { features: MapboxFeature[] };

  return (data.features ?? []).map((f, i) => ({
    id: f.properties.mapbox_id ?? String(i),
    name: f.properties.name,
    fullAddress: f.properties.full_address ?? f.properties.place_formatted ?? f.properties.name,
    lat: f.properties.coordinates.latitude,
    lng: f.properties.coordinates.longitude,
  }));
}
