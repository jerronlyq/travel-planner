"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutGrid,
  Map as MapIcon,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

export function TripNav({
  tripId,
  firstDayId,
}: {
  tripId: string;
  firstDayId: string | null;
}) {
  const pathname = usePathname();

  const items: NavItem[] = [
    {
      key: "overview",
      label: "Overview",
      href: `/trips/${tripId}/overview`,
      icon: LayoutGrid,
      isActive: (p) => p === `/trips/${tripId}` || p.endsWith("/overview"),
    },
    {
      key: "itinerary",
      label: "Itinerary",
      href: firstDayId
        ? `/trips/${tripId}/day/${firstDayId}`
        : `/trips/${tripId}/overview`,
      icon: CalendarDays,
      isActive: (p) => p.includes(`/trips/${tripId}/day/`),
    },
    {
      key: "map",
      label: "Map",
      href: `/trips/${tripId}/map`,
      icon: MapIcon,
      isActive: (p) => p.endsWith("/map"),
    },
    {
      key: "bookings",
      label: "Bookings",
      href: `/trips/${tripId}/bookings`,
      icon: Ticket,
      isActive: (p) => p.endsWith("/bookings"),
    },
    {
      key: "members",
      label: "Members",
      href: `/trips/${tripId}/members`,
      icon: Users,
      isActive: (p) => p.endsWith("/members"),
    },
  ];

  return (
    <>
      {/* Desktop: underline tab row */}
      <nav className="bg-background/80 sticky top-14 z-20 hidden border-b backdrop-blur-md md:block">
        <div className="mx-auto flex w-full max-w-5xl gap-1 px-6">
          {items.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "relative -mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile: fixed bottom bar */}
      <nav className="bg-background/90 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="flex items-stretch">
          {items.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
