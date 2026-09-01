"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDayShort } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

type Day = { id: string; date: string };

export function DayRail({ tripId, days }: { tripId: string; days: Day[] }) {
  const pathname = usePathname();

  // Only relevant on the itinerary (day) routes.
  if (!pathname.includes(`/trips/${tripId}/day/`)) return null;
  if (days.length === 0) return null;

  return (
    <div className="bg-background/90 border-border sticky top-0 z-10 border-b backdrop-blur-md md:hidden">
      <div className="flex w-full gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.map((day, i) => {
          const active = pathname === `/trips/${tripId}/day/${day.id}`;
          const { weekday, day: dayLabel } = formatDayShort(day.date);
          return (
            <Link
              key={day.id}
              href={`/trips/${tripId}/day/${day.id}`}
              className={cn(
                "flex shrink-0 flex-col items-center rounded-[4px] border px-3 py-1.5 text-center transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-brand hover:bg-accent bg-card"
              )}
            >
              <span
                className={cn(
                  "font-mono text-[9.5px] tracking-[0.12em] uppercase",
                  active ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                Day {i + 1}
              </span>
              <span className="text-xs font-medium whitespace-nowrap">
                {weekday} {dayLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
