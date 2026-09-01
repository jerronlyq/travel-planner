import Link from "next/link";
import { notFound } from "next/navigation";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TripHeader } from "@/components/trip/TripHeader";
import { ItemTypeIcon } from "@/components/itinerary/ItemTypeIcon";
import { formatDayShort } from "@/lib/utils/dates";
import { formatPrice } from "@/lib/utils/currency";
import type { Database } from "@/lib/types/database.types";

type ItineraryItem = Database["public"]["Tables"]["itinerary_items"]["Row"];

const CHIP_LIMIT = 6;

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
    .select(
      "id, name, description, destination, start_date, end_date, cover_photo_path"
    )
    .eq("id", tripId)
    .single();

  if (!trip) notFound();

  const { data: coverSigned } = trip.cover_photo_path
    ? await supabase.storage
        .from("trip-photos")
        .createSignedUrl(trip.cover_photo_path, 3600)
    : { data: null };

  const { data: membership } = user
    ? await supabase
        .from("trip_members")
        .select("role")
        .eq("trip_id", tripId)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };
  const canEdit = membership?.role === "owner" || membership?.role === "editor";

  const [{ data: days }, { data: items }] = await Promise.all([
    supabase
      .from("itinerary_days")
      .select("id, date")
      .eq("trip_id", tripId)
      .order("date", { ascending: true }),
    supabase
      .from("itinerary_items")
      .select(
        "id, day_id, type, title, price_amount, price_currency, start_time, sort_order"
      )
      .eq("trip_id", tripId)
      .order("start_time", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true }),
  ]);

  const allItems = (items ?? []) as ItineraryItem[];
  const itemsByDay = new Map<string, ItineraryItem[]>();
  const unscheduled: ItineraryItem[] = [];
  for (const item of allItems) {
    if (!item.day_id) {
      unscheduled.push(item);
      continue;
    }
    const list = itemsByDay.get(item.day_id) ?? [];
    list.push(item);
    itemsByDay.set(item.day_id, list);
  }

  function totalsFor(list: ItineraryItem[]) {
    const totals = new Map<string, number>();
    for (const it of list) {
      if (it.price_amount === null) continue;
      const c = it.price_currency ?? "USD";
      totals.set(c, (totals.get(c) ?? 0) + it.price_amount);
    }
    return totals;
  }

  const tripTotals = totalsFor(allItems);
  const today = new Date();
  const daysUntil = trip.start_date
    ? differenceInCalendarDays(parseISO(trip.start_date), today)
    : null;
  const ended = trip.end_date
    ? differenceInCalendarDays(parseISO(trip.end_date), today) < 0
    : false;
  const started = daysUntil !== null && daysUntil <= 0 && !ended;

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
        coverUrl={coverSigned?.signedUrl ?? null}
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-8">
        <div className="lg:grid lg:grid-cols-[1fr_262px] lg:gap-[30px]">
          {/* Left column */}
          <div className="min-w-0">
            {trip.description && (
              <p className="font-heading mb-7 max-w-[52ch] text-[19px] leading-[1.45]">
                {trip.description}
              </p>
            )}

            {!days || days.length === 0 ? (
              <div className="border-border rounded-[4px] border border-dashed px-6 py-16 text-center">
                <p className="font-heading text-[20px]">No days yet.</p>
                <p className="text-muted-foreground mt-1 text-[13.5px]">
                  Set start and end dates in trip settings to lay out the
                  itinerary.
                </p>
              </div>
            ) : (
              <div className="border-border border-b">
                {days.map((day, i) => {
                  const list = itemsByDay.get(day.id) ?? [];
                  const { weekday, day: dateLabel } = formatDayShort(day.date);
                  const totals = [...totalsFor(list).entries()]
                    .map(([c, a]) => formatPrice(a, c))
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <Link
                      key={day.id}
                      href={`/trips/${tripId}/day/${day.id}`}
                      className="group border-border grid grid-cols-[56px_1fr_auto] items-start gap-4 border-t py-4 transition-colors hover:bg-[oklch(0.97_0.014_85)] sm:grid-cols-[72px_1fr_auto] dark:hover:bg-[oklch(0.26_0.014_60)]"
                    >
                      <div className="leading-none">
                        <div className="font-heading text-[30px] tracking-[-0.02em]">
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        <div className="text-muted-foreground mt-1.5 font-mono text-[9.5px] tracking-[0.1em] uppercase">
                          {weekday} {dateLabel}
                        </div>
                      </div>

                      <div className="min-w-0 pt-1">
                        {list.length === 0 ? (
                          <p className="text-muted-foreground text-[13px]">
                            Nothing planned yet
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {list.slice(0, CHIP_LIMIT).map((it) => (
                              <span
                                key={it.id}
                                className="border-border inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
                              >
                                <ItemTypeIcon
                                  type={it.type}
                                  className="text-muted-foreground size-3"
                                />
                                <span className="max-w-[16ch] truncate">
                                  {it.title}
                                </span>
                              </span>
                            ))}
                            {list.length > CHIP_LIMIT && (
                              <span className="text-muted-foreground px-1 py-0.5 text-[11px]">
                                +{list.length - CHIP_LIMIT}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1.5 text-right">
                        {totals && (
                          <span className="text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                            {totals}
                          </span>
                        )}
                        <ArrowUpRight className="text-muted-foreground group-hover:text-brand size-4 shrink-0 transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {unscheduled.length > 0 && (
              <div className="border-border mt-6 rounded-[4px] border border-dashed p-4">
                <p className="data-label tracking-[0.12em]">Not on a day yet</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {unscheduled.map((it) => (
                    <span
                      key={it.id}
                      className="border-border inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
                    >
                      <ItemTypeIcon
                        type={it.type}
                        className="text-muted-foreground size-3"
                      />
                      <span className="max-w-[18ch] truncate">{it.title}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right rail */}
          <aside className="mt-8 flex flex-col gap-5 lg:mt-0">
            <div className="border-border bg-card rounded-[4px] border p-4">
              <p className="data-label tracking-[0.12em]">
                {ended ? "This trip" : started ? "Right now" : "Countdown"}
              </p>
              <p className="font-heading mt-1.5 text-[40px] leading-none tracking-[-0.02em]">
                {ended
                  ? "Wrapped"
                  : started
                    ? "In progress"
                    : daysUntil !== null
                      ? `${daysUntil} ${daysUntil === 1 ? "day" : "days"}`
                      : "No dates"}
              </p>
            </div>

            <div className="border-border rounded-[4px] border border-dashed p-4">
              <p className="data-label tracking-[0.12em]">Planned spend</p>
              {tripTotals.size === 0 ? (
                <p className="text-muted-foreground mt-1.5 text-[12px]">
                  Nothing priced yet
                </p>
              ) : (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {[...tripTotals.entries()].map(([c, a]) => (
                    <li
                      key={c}
                      className="flex items-baseline justify-between font-mono text-[12px]"
                    >
                      <span className="text-muted-foreground">{c}</span>
                      <span>{formatPrice(a, c)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="relative mx-auto mt-1 w-[190px] rotate-[-1.4deg]">
              <div className="bg-tape absolute -top-2 left-1/2 h-[19px] w-[62px] -translate-x-1/2 rotate-[2deg] border-x border-dashed border-[oklch(0.8_0.05_95)]" />
              <div className="stripe-photo shadow-lift h-[150px] rounded-[3px]" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
