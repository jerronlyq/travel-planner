import { TripMap, type MapDay, type MapItem } from "@/components/map/TripMap";

/**
 * The map column on the day screen. A slim info strip on top, then the map
 * fills the rest — full viewport height and sticky from lg up.
 */
export function DayMapPanel({
  tripId,
  day,
  items,
  totalStops,
}: {
  tripId: string;
  day: MapDay;
  items: MapItem[];
  totalStops: number;
}) {
  const first = items[0];
  const last = items[items.length - 1];
  const endpoints =
    items.length === 0
      ? null
      : items.length === 1
        ? first.title
        : `${first.title}  →  ${last.title}`;
  const unmapped = totalStops - items.length;

  return (
    <div className="border-border flex flex-col border-t lg:sticky lg:top-0 lg:h-dvh lg:border-t-0 lg:border-l">
      <div className="border-border bg-card border-b px-4 py-3">
        <p className="data-label tracking-[0.12em]">On the map today</p>
        {endpoints ? (
          <>
            <p className="font-heading mt-0.5 truncate text-[16px] leading-[1.25] tracking-[-0.01em]">
              {endpoints}
            </p>
            <p className="text-muted-foreground mt-0.5 font-mono text-[10px] tracking-[0.08em] uppercase">
              {items.length} {items.length === 1 ? "stop" : "stops"} pinned
              {unmapped > 0 ? ` · ${unmapped} without a location` : ""}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground mt-0.5 text-[12.5px]">
            No stops have a location yet — add one from the place search when
            editing an item.
          </p>
        )}
      </div>

      <div className="relative h-[280px] shrink-0 lg:h-auto lg:flex-1">
        <TripMap
          tripId={tripId}
          items={items}
          days={[day]}
          hasUnscheduled={false}
        />
      </div>
    </div>
  );
}
