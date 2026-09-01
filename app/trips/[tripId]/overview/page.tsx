import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TripHeader } from "@/components/trip/TripHeader";
import { ItemTypeIcon } from "@/components/itinerary/ItemTypeIcon";
import { formatDayShort } from "@/lib/utils/dates";
import { formatPrice } from "@/lib/utils/currency";
import type { Database } from "@/lib/types/database.types";

type ItineraryItem = Database["public"]["Tables"]["itinerary_items"]["Row"];

const PREVIEW_LIMIT = 5;

function compactTime(item: ItineraryItem): string {
  if (item.all_day) return "All day";
  if (!item.start_time) return "";
  return format(parseISO(item.start_time), "h:mm a");
}

export default async function TripOverviewPage({
  params,
}: PageProps<"/trips/[tripId]/overview">) {
  const { tripId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: trip } = await supabase
    .from("trips")
    .select("id, name, description, destination, start_date, end_date")
    .eq("id", tripId)
    .single();

  if (!trip) notFound();

  const { data: membership } = user
    ? await supabase
        .from("trip_members")
        .select("role")
        .eq("trip_id", tripId)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };
  const canEdit =
    membership?.role === "owner" || membership?.role === "editor";

  const [{ data: days }, { data: items }] = await Promise.all([
    supabase
      .from("itinerary_days")
      .select("id, date")
      .eq("trip_id", tripId)
      .order("date", { ascending: true }),
    supabase
      .from("itinerary_items")
      .select(
        "id, day_id, type, title, start_time, end_time, all_day, price_amount, price_currency, sort_order"
      )
      .eq("trip_id", tripId)
      .order("start_time", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true }),
  ]);

  const itemsByDay = new Map<string, ItineraryItem[]>();
  const unscheduled: ItineraryItem[] = [];
  for (const item of (items ?? []) as ItineraryItem[]) {
    if (!item.day_id) {
      unscheduled.push(item);
      continue;
    }
    const list = itemsByDay.get(item.day_id) ?? [];
    list.push(item);
    itemsByDay.set(item.day_id, list);
  }

  function dayTotals(list: ItineraryItem[]) {
    const totals = new Map<string, number>();
    for (const it of list) {
      if (it.price_amount === null) continue;
      const c = it.price_currency ?? "USD";
      totals.set(c, (totals.get(c) ?? 0) + it.price_amount);
    }
    return [...totals.entries()]
      .map(([c, a]) => formatPrice(a, c))
      .filter(Boolean)
      .join(" · ");
  }

  return (
    <div>
      <TripHeader
        tripId={tripId}
        name={trip.name}
        destination={trip.destination}
        startDate={trip.start_date}
        endDate={trip.end_date}
        dayCount={days?.length ?? 0}
        canEdit={canEdit}
      />

      <div className="mx-auto w-full max-w-3xl space-y-4 px-6 py-7 md:px-8">
        {trip.description && (
          <p className="font-heading max-w-[52ch] text-[19px] leading-[1.4]">
            {trip.description}
          </p>
        )}

        {!days || days.length === 0 ? (
          <div className="border-border rounded-[4px] border border-dashed px-6 py-16 text-center">
            <p className="font-heading text-[20px]">No days yet.</p>
            <p className="text-muted-foreground mt-1 text-[13.5px]">
              Set start and end dates in trip settings to lay out the itinerary.
            </p>
          </div>
        ) : (
        days.map((day, i) => {
          const list = itemsByDay.get(day.id) ?? [];
          const { weekday, day: dateLabel } = formatDayShort(day.date);
          const totals = dayTotals(list);
          const extra = list.length - PREVIEW_LIMIT;

          return (
            <Link
              key={day.id}
              href={`/trips/${tripId}/day/${day.id}`}
              className="group focus-visible:ring-ring block rounded-2xl outline-none focus-visible:ring-2"
            >
              <div className="bg-card ring-border shadow-[var(--shadow-soft)] group-hover:ring-primary/40 rounded-2xl px-4 py-3.5 ring-1 transition-shadow group-hover:shadow-[var(--shadow-lift)]">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-10 shrink-0 flex-col items-center justify-center rounded-xl leading-none">
                    <span className="text-[10px] font-semibold tracking-wide uppercase">
                      Day
                    </span>
                    <span className="text-sm font-bold">{i + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {weekday}, {dateLabel}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {list.length === 0
                        ? "Nothing planned"
                        : `${list.length} ${list.length === 1 ? "item" : "items"}${
                            totals ? ` · ${totals}` : ""
                          }`}
                    </p>
                  </div>
                  <ArrowUpRight className="text-muted-foreground group-hover:text-brand size-4 shrink-0 transition-colors" />
                </div>

                {list.length > 0 && (
                  <ul className="border-border/70 mt-3 space-y-1.5 border-t pt-3">
                    {list.slice(0, PREVIEW_LIMIT).map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="text-muted-foreground w-16 shrink-0 text-xs tabular-nums">
                          {compactTime(item)}
                        </span>
                        <ItemTypeIcon
                          type={item.type}
                          className="text-muted-foreground size-3.5 shrink-0"
                        />
                        <span className="truncate">{item.title}</span>
                      </li>
                    ))}
                    {extra > 0 && (
                      <li className="text-muted-foreground pl-[4.5rem] text-xs">
                        +{extra} more
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </Link>
          );
        })
      )}

      {unscheduled.length > 0 && (
        <div className="bg-card ring-border shadow-[var(--shadow-soft)] rounded-2xl px-4 py-3.5 ring-1">
          <p className="font-medium">Unscheduled</p>
          <p className="text-muted-foreground text-xs">
            {unscheduled.length} {unscheduled.length === 1 ? "item" : "items"} not
            assigned to a day
          </p>
          <ul className="border-border/70 mt-3 space-y-1.5 border-t pt-3">
            {unscheduled.slice(0, PREVIEW_LIMIT).map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <ItemTypeIcon
                  type={item.type}
                  className="text-muted-foreground size-3.5 shrink-0"
                />
                <span className="truncate">{item.title}</span>
              </li>
            ))}
            {unscheduled.length > PREVIEW_LIMIT && (
              <li className="text-muted-foreground text-xs">
                +{unscheduled.length - PREVIEW_LIMIT} more
              </li>
            )}
          </ul>
        </div>
        )}
      </div>
    </div>
  );
}
