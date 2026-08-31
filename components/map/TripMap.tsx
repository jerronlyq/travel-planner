"use client";

import { useState } from "react";
import Link from "next/link";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { ItemTypeIcon } from "@/components/itinerary/ItemTypeIcon";
import type { ItineraryItemType } from "@/lib/types/database.types";

export type MapItem = {
  id: string;
  title: string;
  type: ItineraryItemType;
  lat: number;
  lng: number;
  dayId: string | null;
  dayLabel: string | null;
};

export function TripMap({ tripId, items }: { tripId: string; items: MapItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const active = items.find((i) => i.id === activeId) ?? null;

  if (!token) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Map view needs a Mapbox token — add NEXT_PUBLIC_MAPBOX_TOKEN to your
        environment variables.
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        No items with a location yet. Add one via place search when editing
        an itinerary item.
      </div>
    );
  }

  const centerLat = items.reduce((sum, i) => sum + i.lat, 0) / items.length;
  const centerLng = items.reduce((sum, i) => sum + i.lng, 0) / items.length;

  return (
    <Map
      mapboxAccessToken={token}
      initialViewState={{ latitude: centerLat, longitude: centerLng, zoom: 12 }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="top-right" />
      {items.map((item) => (
        <Marker
          key={item.id}
          latitude={item.lat}
          longitude={item.lng}
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setActiveId(item.id);
          }}
        >
          <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow">
            <ItemTypeIcon type={item.type} className="size-3.5" />
          </div>
        </Marker>
      ))}

      {active && (
        <Popup
          latitude={active.lat}
          longitude={active.lng}
          onClose={() => setActiveId(null)}
          closeOnClick={false}
          offset={16}
        >
          <div className="text-sm">
            <p className="font-medium">{active.title}</p>
            {active.dayLabel && (
              <p className="text-xs text-muted-foreground">{active.dayLabel}</p>
            )}
            {active.dayId && (
              <Link
                href={`/trips/${tripId}/day/${active.dayId}`}
                className="mt-1 inline-block text-xs text-primary underline"
              >
                Open day
              </Link>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
}
