"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TripMap, type MapDay, type MapItem } from "@/components/map/TripMap";
import { ItemTypeIcon } from "@/components/itinerary/ItemTypeIcon";
import { formatTimeRange } from "@/lib/utils/dates";
import { formatPrice } from "@/lib/utils/currency";

/**
 * The map column on the day screen. A slim info strip on top, then the map
 * fills the rest. Clicking the strip or the expand button opens a centred
 * dialog with a large map and the full stop list.
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
  const [expanded, setExpanded] = useState(false);

  const first = items[0];
  const last = items[items.length - 1];
  const endpoints =
    items.length === 0
      ? null
      : items.length === 1
        ? first.title
        : `${first.title}  →  ${last.title}`;
  const unmapped = totalStops - items.length;

  const summaryLine =
    endpoints &&
    `${items.length} ${items.length === 1 ? "stop" : "stops"} pinned${
      unmapped > 0 ? ` · ${unmapped} without a location` : ""
    }`;

  return (
    <>
      <div className="border-border flex flex-col border-t lg:sticky lg:top-0 lg:h-dvh lg:border-t-0 lg:border-l">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="border-border bg-card hover:bg-accent/50 block border-b px-4 py-3 text-left transition-colors"
        >
          <p className="data-label tracking-[0.12em]">On the map today</p>
          {endpoints ? (
            <>
              <p className="font-heading mt-0.5 truncate text-[16px] leading-[1.25] tracking-[-0.01em]">
                {endpoints}
              </p>
              <p className="text-muted-foreground mt-0.5 font-mono text-[10px] tracking-[0.08em] uppercase">
                {summaryLine} · tap to expand
              </p>
            </>
          ) : (
            <p className="text-muted-foreground mt-0.5 text-[12.5px]">
              No stops have a location yet — add one from the place search when
              editing an item.
            </p>
          )}
        </button>

        <div className="relative h-[280px] shrink-0 lg:h-auto lg:flex-1">
          <TripMap
            tripId={tripId}
            items={items}
            days={[day]}
            hasUnscheduled={false}
          />
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="border-border bg-background/90 hover:bg-background text-muted-foreground hover:text-foreground absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-md backdrop-blur transition-colors"
            >
              <Maximize2 className="size-3.5" />
              Expand
            </button>
          )}
        </div>
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="flex h-[86vh] max-w-[min(1100px,95vw)] flex-col overflow-hidden p-0 sm:max-w-[min(1100px,95vw)]">
          <div className="border-border shrink-0 border-b px-5 py-3.5">
            <DialogTitle className="data-label tracking-[0.12em]">
              {day.label} · on the map
            </DialogTitle>
            {endpoints ? (
              <>
                <p className="font-heading mt-0.5 text-[19px] leading-[1.2] tracking-[-0.01em]">
                  {endpoints}
                </p>
                <p className="text-muted-foreground mt-0.5 font-mono text-[10px] tracking-[0.08em] uppercase">
                  {summaryLine}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground mt-0.5 text-[13px]">
                No stops have a location yet.
              </p>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <div className="relative min-h-[45%] flex-1">
              {expanded && (
                <TripMap
                  tripId={tripId}
                  items={items}
                  days={[day]}
                  hasUnscheduled={false}
                />
              )}
            </div>

            {items.length > 0 && (
              <ol className="border-border max-h-[38%] shrink-0 overflow-y-auto border-t md:max-h-none md:w-72 md:border-t-0 md:border-l">
                {items.map((it) => {
                  const time = formatTimeRange(
                    it.startTime,
                    it.endTime,
                    it.allDay
                  );
                  const price = formatPrice(it.priceAmount, it.priceCurrency);
                  return (
                    <li
                      key={it.id}
                      className="border-border/70 flex gap-3 border-b px-4 py-3 last:border-b-0"
                    >
                      <span className="bg-primary text-primary-foreground font-mono mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px]">
                        {it.orderInDay ?? "·"}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-[14px] leading-[1.3] font-medium">
                          <ItemTypeIcon
                            type={it.type}
                            className="text-muted-foreground size-3.5 shrink-0"
                          />
                          <span className="truncate">{it.title}</span>
                        </p>
                        {it.address && (
                          <p className="text-muted-foreground mt-0.5 text-[12px] leading-[1.4]">
                            {it.address}
                          </p>
                        )}
                        {(time || price) && (
                          <p className="text-muted-foreground mt-0.5 font-mono text-[10px] tracking-[0.06em]">
                            {[time, price].filter(Boolean).join("  ·  ")}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
