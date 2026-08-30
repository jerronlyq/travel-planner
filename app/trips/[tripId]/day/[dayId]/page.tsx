import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DayView } from "@/components/itinerary/DayView";

export default async function DayPage({
  params,
}: PageProps<"/trips/[tripId]/day/[dayId]">) {
  const { tripId, dayId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: trip } = await supabase
    .from("trips")
    .select("default_currency")
    .eq("id", tripId)
    .single();

  const { data: items } = await supabase
    .from("itinerary_items")
    .select("*")
    .eq("day_id", dayId)
    .order("sort_order", { ascending: true });

  if (!trip || !user) notFound();

  return (
    <DayView
      tripId={tripId}
      dayId={dayId}
      createdBy={user.id}
      defaultCurrency={trip.default_currency}
      initialItems={items ?? []}
    />
  );
}
