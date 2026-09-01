"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Map, {
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { ExternalLink, Navigation } from "lucide-react";
import { ItemTypeIcon } from "@/components/itinerary/ItemTypeIcon";
import { formatTimeRange } from "@/lib/utils/dates";
import { formatPrice } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { ItineraryItemType } from "@/lib/types/database.types";

export type MapDay = { id: string; number: number; label: string };

export type MapItem = {
  id: string;
  title: string;
  type: ItineraryItemType;
  lat: number;
  lng: number;
  dayId: string | null;
  dayNumber: number | null;
  dayLabel: string | null;
  orderInDay: number | null;
  address: string | null;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  priceAmount: number | null;
  priceCurrency: string | null;
};

// Distinct, map-legible hues; cycles if a trip runs longer than the list.
const DAY_COLORS = [
  "#2563eb",
  "#db2777",
  "#16a34a",
  "#f59e0b",
  "#7c3aed",
  "#0891b2",
  "#dc2626",
  "#4338ca",
  "#ca8a04",
  "#0d9488",
];
const UNSCHEDULED_COLOR = "#64748b";

function dayColor(dayNumber: number | null): string {
  if (!dayNumber) return UNSCHEDULED_COLOR;
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
}

function InfoState({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-center text-sm">
      {children}
    </div>
  );
}

export function TripMap({
  tripId,
  items,
  days,
  hasUnscheduled,
}: {
  tripId: string;
  items: MapItem[];
  days: MapDay[];
  hasUnscheduled: boolean;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapRef = useRef<MapRef>(null);
  const firstFit = useRef(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const visible = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "unscheduled") return items.filter((i) => !i.dayId);
    return items.filter((i) => i.dayId === filter);
  }, [items, filter]);

  const active = visible.find((i) => i.id === activeId) ?? null;

  function fitToVisible(duration = 500) {
    const map = mapRef.current;
    if (!map || visible.length === 0) return;
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const i of visible) {
      minLng = Math.min(minLng, i.lng);
      maxLng = Math.max(maxLng, i.lng);
      minLat = Math.min(minLat, i.lat);
      maxLat = Math.max(maxLat, i.lat);
    }
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 44, maxZoom: 15, duration }
    );
  }

  // Re-frame when the filter changes (the initial fit is done in onLoad).
  useEffect(() => {
    if (firstFit.current) {
      firstFit.current = false;
      return;
    }
    fitToVisible();
    setActiveId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  if (!token) {
    return (
      <InfoState>
        Map view needs a Mapbox token — add NEXT_PUBLIC_MAPBOX_TOKEN to your
        environment variables.
      </InfoState>
    );
  }

  if (items.length === 0) {
    return (
      <InfoState>
        No items with a location yet. Add one via place search when editing an
        itinerary item.
      </InfoState>
    );
  }

  const first = items[0];

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={{ latitude: first.lat, longitude: first.lng, zoom: 3 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "100%" }}
        onLoad={() => fitToVisible(0)}
      >
        <NavigationControl position="top-right" />

        {visible.map((item) => {
          const color = dayColor(item.dayNumber);
          const isActive = item.id === activeId;
          return (
            <Marker
              key={item.id}
              latitude={item.lat}
              longitude={item.lng}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setActiveId(item.id);
              }}
            >
              <button
                type="button"
                title={item.title}
                style={{ backgroundColor: color }}
                className={cn(
                  "flex items-center justify-center rounded-full border-2 border-white font-bold text-white shadow-md transition-transform",
                  isActive ? "z-10 size-8 scale-110 text-xs" : "size-6 text-[11px]"
                )}
              >
                {item.orderInDay ?? (
                  <ItemTypeIcon type={item.type} className="size-3.5 text-white" />
                )}
              </button>
            </Marker>
          );
        })}

        {active && (
          <Popup
            latitude={active.lat}
            longitude={active.lng}
            anchor="top"
            offset={18}
            maxWidth="270px"
            closeOnClick={false}
            onClose={() => setActiveId(null)}
          >
            <div className="space-y-1.5">
              <span
                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: dayColor(active.dayNumber) }}
              >
                {active.dayNumber ? `Day ${active.dayNumber}` : "Unscheduled"}
                {active.orderInDay ? ` · Stop ${active.orderInDay}` : ""}
              </span>

              <p className="flex items-center gap-1.5 text-sm font-medium">
                <ItemTypeIcon
                  type={active.type}
                  className="text-muted-foreground size-3.5 shrink-0"
                />
                <span>{active.title}</span>
              </p>

              {formatTimeRange(active.startTime, active.endTime, active.allDay) && (
                <p className="text-muted-foreground text-xs">
                  {formatTimeRange(
                    active.startTime,
                    active.endTime,
                    active.allDay
                  )}
                </p>
              )}
              {formatPrice(active.priceAmount, active.priceCurrency) && (
                <p className="text-xs font-medium">
                  {formatPrice(active.priceAmount, active.priceCurrency)}
                </p>
              )}
              {active.address && (
                <p className="text-muted-foreground text-xs">{active.address}</p>
              )}

              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5 text-xs">
                {active.dayId && (
                  <Link
                    href={`/trips/${tripId}/day/${active.dayId}`}
                    className="text-primary underline"
                  >
                    Open day
                  </Link>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${active.lat},${active.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary inline-flex items-center gap-1 underline"
                >
                  <ExternalLink className="size-3" />
                  Google Maps
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${active.lat},${active.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary inline-flex items-center gap-1 underline"
                >
                  <Navigation className="size-3" />
                  Directions
                </a>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Day legend / filter — hidden when there's only one day to show */}
      {(days.length > 1 || hasUnscheduled) && (
      <div className="bg-background/90 border-border absolute top-3 left-3 z-10 max-h-[60%] w-52 overflow-y-auto rounded-[6px] border p-1.5 text-xs shadow-md backdrop-blur">
        <p className="data-label px-2 py-1">Filter by day</p>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "hover:bg-accent block w-full rounded-md px-2 py-1 text-left",
            filter === "all" && "bg-accent font-medium"
          )}
        >
          All days
        </button>
        {days.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setFilter(d.id)}
            className={cn(
              "hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1 text-left",
              filter === d.id && "bg-accent font-medium"
            )}
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: dayColor(d.number) }}
            />
            <span className="truncate">{d.label}</span>
          </button>
        ))}
        {hasUnscheduled && (
          <button
            type="button"
            onClick={() => setFilter("unscheduled")}
            className={cn(
              "hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1 text-left",
              filter === "unscheduled" && "bg-accent font-medium"
            )}
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: UNSCHEDULED_COLOR }}
            />
            Unscheduled
          </button>
        )}
      </div>
      )}

      {visible.length === 0 && (
        <div className="bg-background/90 text-muted-foreground absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full border px-3 py-1 text-xs shadow-md backdrop-blur">
          No places pinned for this day
        </div>
      )}
    </div>
  );
}
