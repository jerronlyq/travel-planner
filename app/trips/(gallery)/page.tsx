import { createClient } from "@/lib/supabase/server";
import { TripGallery } from "@/components/trip/TripGallery";

const thumbOf = (path: string) => path.replace(/\.jpg$/, "_thumb.jpg");

export default async function TripsPage() {
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: true, nullsFirst: false });

  const list = trips ?? [];

  // Sign each trip's cover (prefer the 640px thumb) in one batch.
  const covers: Record<string, string> = {};
  const withCovers = list.filter((t) => t.cover_photo_path);
  if (withCovers.length > 0) {
    const fullPaths = withCovers.map((t) => t.cover_photo_path as string);
    const { data: signed } = await supabase.storage
      .from("trip-photos")
      .createSignedUrls([...fullPaths.map(thumbOf), ...fullPaths], 3600);
    const urlByPath = new Map(
      (signed ?? [])
        .filter((s) => s.signedUrl)
        .map((s) => [s.path, s.signedUrl])
    );
    for (const t of withCovers) {
      const full = t.cover_photo_path as string;
      const url = urlByPath.get(thumbOf(full)) ?? urlByPath.get(full);
      if (url) covers[t.id] = url;
    }
  }

  return <TripGallery trips={list} covers={covers} />;
}
