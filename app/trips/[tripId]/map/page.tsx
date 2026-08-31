import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDayLabel } from "@/lib/utils/dates";
import { TripMap, type MapDay, type MapItem } from "@/components/map/TripMap";

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
      .select(
        "id, title, type, lat, lng, day_id, location_address, start_time, end_time, all_day, price_amount, price_currency, sort_order"
      )
      .eq("trip_id", tripId)
      .not("lat", "is", null)
      .not("lng", "is", null),
  ]);

  const dayList = days ?? [];
  const dayIndexById = new Map(dayList.map((d, i) => [d.id, i] as const));

  const mapDays: MapDay[] = dayList.map((d, i) => ({
    id: d.id,
    number: i + 1,
    label: formatDayLabel(d.date, i + 1),
  }));

  // Chronological within each day, days in trip order, unscheduled last.
  const sorted = [...(items ?? [])].sort((a, b) => {
    const ai = a.day_id ? (dayIndexById.get(a.day_id) ?? 998) : 999;
    const bi = b.day_id ? (dayIndexById.get(b.day_id) ?? 998) : 999;
    if (ai !== bi) return ai - bi;
    const at = a.start_time ?? "~";
    const bt = b.start_time ?? "~";
    if (at !== bt) return at < bt ? -1 : 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const orderCounter = new Map<string, number>();
  const mapItems: MapItem[] = sorted.map((it) => {
    const key = it.day_id ?? "unscheduled";
    const order = (orderCounter.get(key) ?? 0) + 1;
    orderCounter.set(key, order);
    const dayIdx = it.day_id ? dayIndexById.get(it.day_id) : undefined;
    return {
      id: it.id,
      title: it.title,
      type: it.type,
      lat: it.lat as number,
      lng: it.lng as number,
      dayId: it.day_id,
      dayNumber: dayIdx !== undefined ? dayIdx + 1 : null,
      dayLabel: dayIdx !== undefined ? mapDays[dayIdx].label : null,
      orderInDay: it.day_id ? order : null,
      address: it.location_address,
      startTime: it.start_time,
      endTime: it.end_time,
      allDay: it.all_day,
      priceAmount: it.price_amount,
      priceCurrency: it.price_currency,
    };
  });

  return (
    <div className="h-[calc(100dvh-7rem)] w-full">
      <TripMap
        tripId={tripId}
        items={mapItems}
        days={mapDays}
        hasUnscheduled={mapItems.some((i) => !i.dayId)}
      />
    </div>
  );
}
