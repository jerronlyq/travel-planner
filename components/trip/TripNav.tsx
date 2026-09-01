"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
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
  isActive: (p: string) => boolean;
};

/**
 * Mobile only now — the desktop tab row is replaced by TripSidebar.
 */
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
      icon: BookOpen,
      isActive: (p) => p === `/trips/${tripId}` || p.endsWith("/overview"),
    },
    {
      key: "itinerary",
      label: "Itinerary",
      href: firstDayId ? `/trips/${tripId}/day/${firstDayId}` : `/trips/${tripId}/overview`,
      icon: CalendarDays,
      isActive: (p) => p.includes(`/trips/${tripId}/day/`),
    },
    { key: "map", label: "Map", href: `/trips/${tripId}/map`, icon: MapIcon, isActive: (p) => p.endsWith("/map") },
    { key: "bookings", label: "Bookings", href: `/trips/${tripId}/bookings`, icon: Ticket, isActive: (p) => p.endsWith("/bookings") },
    { key: "members", label: "People", href: `/trips/${tripId}/members`, icon: Users, isActive: (p) => p.endsWith("/members") },
  ];

  return (
    <nav className="bg-background/95 border-border fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <div className="flex items-stretch">
        {items.map((item) => {
          const active = item.isActive(pathname);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "font-mono flex flex-1 flex-col items-center gap-1 py-2 text-[10px] tracking-[0.08em] uppercase transition-colors duration-150",
                active ? "text-brand" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
