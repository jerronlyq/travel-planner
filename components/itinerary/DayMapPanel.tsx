import { TripMap, type MapDay, type MapItem } from "@/components/map/TripMap";

/**
 * The map column on the day screen. Reuses TripMap (scoped to this day's
 * located stops) and lays a "today's route" card over the bottom edge.
 */
export function DayMapPanel({
  tripId,
  day,
  items,
}: {
  tripId: string;
  day: MapDay;
  items: MapItem[];
}) {
  const route = items
    .map((i) => i.title)
    .filter(Boolean)
    .join("  →  ");

  return (
    <div className="border-border relative h-[220px] border-b lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-l">
      <TripMap tripId={tripId} items={items} days={[day]} hasUnscheduled={false} />

      {items.length > 0 && (
        <div className="border-border bg-card absolute inset-x-3 bottom-3 z-10 rounded-[6px] border p-3 shadow-[var(--shadow-lift)]">
          <p className="data-label tracking-[0.12em]">Today&rsquo;s route</p>
          <p className="font-heading mt-1 line-clamp-2 text-[16px] leading-[1.25] tracking-[-0.01em]">
            {route}
          </p>
          <p className="text-muted-foreground mt-1 font-mono text-[10px] tracking-[0.08em] uppercase">
            {items.length} {items.length === 1 ? "stop" : "stops"} on the map
          </p>
        </div>
      )}
    </div>
  );
}
