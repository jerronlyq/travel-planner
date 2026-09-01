import { createClient } from "@/lib/supabase/server";
import { TripGallery } from "@/components/trip/TripGallery";

export default async function TripsPage() {
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: true, nullsFirst: false });

  const list = trips ?? [];

  // Sign each trip's cover in one batch.
  const covers: Record<string, string> = {};
  const withCovers = list.filter((t) => t.cover_photo_path);
  if (withCovers.length > 0) {
    const { data: signed } = await supabase.storage
      .from("trip-photos")
      .createSignedUrls(
        withCovers.map((t) => t.cover_photo_path as string),
        3600
      );
    const urlByPath = new Map(signed?.map((s) => [s.path, s.signedUrl]));
    for (const t of withCovers) {
      const url = urlByPath.get(t.cover_photo_path as string);
      if (url) covers[t.id] = url;
    }
  }

  return <TripGallery trips={list} covers={covers} />;
}
