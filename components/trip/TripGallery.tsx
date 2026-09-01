"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { isBefore, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { TripCard } from "@/components/trip/TripCard";
import type { Database } from "@/lib/types/database.types";

type Trip = Database["public"]["Tables"]["trips"]["Row"];

const FILTERS = ["All", "Upcoming", "Past"] as const;
type Filter = (typeof FILTERS)[number];

function isPast(trip: Trip): boolean {
  if (!trip.start_date) return false;
  return isBefore(parseISO(trip.start_date), new Date());
}

export function TripGallery({ trips }: { trips: Trip[] }) {
  const [filter, setFilter] = useState<Filter>("All");

  const inProgress = trips.filter((t) => t.start_date && t.end_date).length;

  const visible = useMemo(() => {
    if (filter === "Upcoming") return trips.filter((t) => !isPast(t));
    if (filter === "Past") return trips.filter(isPast);
    return trips;
  }, [trips, filter]);

  return (
    <div className="w-full flex-1 px-4 py-7 sm:px-8">
      <div className="border-border flex flex-wrap items-end justify-between gap-4 border-b pb-3.5">
        <div>
          <p className="eyebrow text-brand">
            {trips.length === 0
              ? "Nothing on the calendar"
              : `${trips.length} ${trips.length === 1 ? "trip" : "trips"} · ${inProgress} in progress`}
          </p>
          <h1 className="font-heading mt-0.5 text-[40px] leading-[1.1] font-medium tracking-[-0.02em]">
            Where you&rsquo;re headed
          </h1>
        </div>

        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "font-mono rounded-full px-2.5 py-[5px] text-[10px] tracking-[0.1em] uppercase transition-colors duration-150",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-brand hover:text-brand border"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="border-border mt-7 rounded-[4px] border border-dashed px-6 py-16 text-center">
          <p className="font-heading text-[20px]">
            No trips yet — start the first one.
          </p>
          <p className="text-muted-foreground mt-1 text-[13.5px]">
            Give it a name and rough dates; the days lay themselves out.
          </p>
          <Link
            href="/trips/new"
            className="bg-primary text-primary-foreground press mt-5 inline-flex h-10 items-center rounded-full px-5 text-[13.5px] font-semibold"
          >
            Start a trip
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground mt-7 text-[13.5px]">
          No {filter.toLowerCase()} trips.
        </p>
      ) : (
        <div className="mt-7 grid grid-cols-2 gap-[22px] md:grid-cols-3 xl:grid-cols-4">
          {visible.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
