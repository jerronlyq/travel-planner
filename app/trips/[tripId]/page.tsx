import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function TripIndexPage({
  params,
}: PageProps<"/trips/[tripId]">) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: firstDay } = await supabase
    .from("itinerary_days")
    .select("id")
    .eq("trip_id", tripId)
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle();

  redirect(firstDay ? `/trips/${tripId}/day/${firstDay.id}` : `/trips/${tripId}/overview`);
}
