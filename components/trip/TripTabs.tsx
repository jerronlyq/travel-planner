"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDayLabel } from "@/lib/utils/dates";
import { useTripRole } from "@/components/trip/TripRoleContext";

type Day = { id: string; date: string };

export function TripTabs({ tripId, days }: { tripId: string; days: Day[] }) {
  const pathname = usePathname();
  const role = useTripRole();

  const tabs = [
    { href: `/trips/${tripId}/overview`, label: "Overview" },
    ...days.map((day, i) => ({
      href: `/trips/${tripId}/day/${day.id}`,
      label: formatDayLabel(day.date, i + 1),
    })),
    { href: `/trips/${tripId}/map`, label: "Map" },
    { href: `/trips/${tripId}/bookings`, label: "Bookings" },
    { href: `/trips/${tripId}/members`, label: "Members" },
    ...(role === "owner"
      ? [{ href: `/trips/${tripId}/settings`, label: "Settings" }]
      : []),
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b px-6">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-3 text-sm whitespace-nowrap transition-colors",
              active
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
