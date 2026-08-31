import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDayLabel } from "@/lib/utils/dates";
import { TripMap, type MapItem } from "@/components/map/TripMap";

export default async function TripMapPage({
  params,
}: PageProps<"/trips/[tripId]/map">) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("id")
    .eq("id", tripId)
    .single();

  if (!trip) notFound();

  const [{ data: days }, { data: items }] = await Promise.all([
    supabase
      .from("itinerary_days")
      .select("id, date")
      .eq("trip_id", tripId)
      .order("date", { ascending: true }),
    supabase
      .from("itinerary_items")
      .select("id, title, type, lat, lng, day_id")
      .eq("trip_id", tripId)
      .not("lat", "is", null)
      .not("lng", "is", null)
      .order("sort_order", { ascending: true }),
  ]);

  const dayLabelById = new Map(
    (days ?? []).map((day, i) => [day.id, formatDayLabel(day.date, i + 1)])
  );

  const mapItems: MapItem[] = (items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    lat: item.lat as number,
    lng: item.lng as number,
    dayId: item.day_id,
    dayLabel: item.day_id ? dayLabelById.get(item.day_id) ?? null : null,
  }));

  return (
    <div className="h-[calc(100dvh-7rem)] w-full">
      <TripMap tripId={tripId} items={mapItems} />
    </div>
  );
}
