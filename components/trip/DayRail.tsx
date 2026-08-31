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
    <div className="bg-background/80 sticky top-14 z-10 border-b backdrop-blur-md md:top-[6.5rem]">
      <div className="mx-auto flex w-full max-w-5xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.map((day, i) => {
          const active = pathname === `/trips/${tripId}/day/${day.id}`;
          const { weekday, day: dayLabel } = formatDayShort(day.date);
          return (
            <Link
              key={day.id}
              href={`/trips/${tripId}/day/${day.id}`}
              className={cn(
                "flex shrink-0 flex-col items-center rounded-xl border px-3 py-1.5 text-center transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-foreground/20 hover:bg-accent bg-card"
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-wide uppercase",
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
