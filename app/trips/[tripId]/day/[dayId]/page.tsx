import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { DayView } from "@/components/itinerary/DayView";
import { DayMapPanel } from "@/components/itinerary/DayMapPanel";
import type { MapItem } from "@/components/map/TripMap";

export default async function DayPage({
  params,
}: PageProps<"/trips/[tripId]/day/[dayId]">) {
  const { tripId, dayId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: trip }, { data: dayRows }, { data: items }] = await Promise.all([
    supabase.from("trips").select("*").eq("id", tripId).single(),
    supabase
      .from("itinerary_days")
      .select("id, date")
      .eq("trip_id", tripId)
      .order("date", { ascending: true }),
    supabase
      .from("itinerary_items")
      .select("*")
      .eq("day_id", dayId)
      .order("sort_order", { ascending: true }),
  ]);

  if (!trip || !user) notFound();

  const days = dayRows ?? [];
  const dayIndex = days.findIndex((d) => d.id === dayId);
  const day = days[dayIndex];
  if (!day) notFound();

  const dayNumber = dayIndex + 1;

  const located = (items ?? []).filter(
    (it) => it.lat !== null && it.lng !== null
  );
  const mapItems: MapItem[] = located.map((it, i) => ({
    id: it.id,
    title: it.title,
    type: it.type,
    lat: it.lat as number,
    lng: it.lng as number,
    dayId: dayId,
    dayNumber,
    dayLabel: format(parseISO(day.date), "EEE, MMM d"),
    orderInDay: i + 1,
    address: it.location_address,
    startTime: it.start_time,
    endTime: it.end_time,
    allDay: it.all_day,
    priceAmount: it.price_amount,
    priceCurrency: it.price_currency,
  }));

  return (
    <div className="flex flex-col-reverse lg:grid lg:grid-cols-[1fr_400px]">
      <DayView
        tripId={tripId}
        dayId={dayId}
        dayNumber={dayNumber}
        dayDate={day.date}
        createdBy={user.id}
        defaultCurrency={trip.default_currency}
        tripCountry={trip.country_code}
        initialItems={items ?? []}
      />
      <DayMapPanel
        tripId={tripId}
        day={{
          id: dayId,
          number: dayNumber,
          label: format(parseISO(day.date), "EEE, MMM d"),
        }}
        items={mapItems}
      />
    </div>
  );
}
