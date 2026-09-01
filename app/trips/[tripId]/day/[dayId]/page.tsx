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

  // Image attachments for this day's items -> up to 2 signed thumbs + a credit.
  const itemIds = (items ?? []).map((it) => it.id);
  const photosByItem: Record<
    string,
    { urls: string[]; count: number; credit: string | null }
  > = {};
  if (itemIds.length > 0) {
    const { data: photoRows } = await supabase
      .from("item_attachments")
      .select("item_id, storage_path, uploaded_by")
      .in("item_id", itemIds)
      .like("mime_type", "image/%")
      .order("sort_order", { ascending: true });

    if (photoRows && photoRows.length > 0) {
      const { data: signed } = await supabase.storage
        .from("trip-photos")
        .createSignedUrls(
          photoRows.map((r) => r.storage_path),
          3600
        );
      const urlByPath = new Map(
        (signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl])
      );

      const uploaderIds = [
        ...new Set(photoRows.map((r) => r.uploaded_by).filter(Boolean)),
      ];
      const { data: profs } = uploaderIds.length
        ? await supabase
            .from("profiles")
            .select("id, display_name, email")
            .in("id", uploaderIds)
        : { data: [] };
      const nameById = new Map(
        (profs ?? []).map((p) => [
          p.id,
          (p.display_name || p.email || "").split(" ")[0] || null,
        ])
      );

      for (const r of photoRows) {
        const entry =
          photosByItem[r.item_id] ??
          (photosByItem[r.item_id] = { urls: [], count: 0, credit: null });
        entry.count += 1;
        const url = urlByPath.get(r.storage_path);
        if (url && entry.urls.length < 2) entry.urls.push(url);
        if (!entry.credit) entry.credit = nameById.get(r.uploaded_by) ?? null;
      }
    }
  }

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
    <div className="flex flex-col-reverse lg:grid lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_500px]">
      <DayView
        tripId={tripId}
        dayId={dayId}
        dayNumber={dayNumber}
        dayDate={day.date}
        createdBy={user.id}
        defaultCurrency={trip.default_currency}
        tripCountry={trip.country_code}
        initialItems={items ?? []}
        photosByItem={photosByItem}
      />
      <DayMapPanel
        tripId={tripId}
        day={{
          id: dayId,
          number: dayNumber,
          label: format(parseISO(day.date), "EEE, MMM d"),
        }}
        items={mapItems}
        totalStops={(items ?? []).length}
      />
    </div>
  );
}
