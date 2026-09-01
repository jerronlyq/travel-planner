import { createClient } from "@/lib/supabase/server";
import { TripGallery } from "@/components/trip/TripGallery";

export default async function TripsPage() {
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: true, nullsFirst: false });

  return <TripGallery trips={trips ?? []} />;
}
