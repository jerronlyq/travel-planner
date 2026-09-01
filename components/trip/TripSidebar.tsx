"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Map as MapIcon,
  Settings,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import { formatDayShort } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

type Day = { id: string; date: string; itemCount?: number };

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  count?: string;
  isActive: (p: string) => boolean;
};

/**
 * Desktop trip navigation. Replaces the old top tab row (TripNav) and the
 * horizontal DayRail — the day list lives here now. Hidden below md, where
 * TripNav's bottom bar takes over.
 */
export function TripSidebar({
  tripId,
  tripName,
  days,
  firstDayId,
  memberInitials,
  isOwner,
}: {
  tripId: string;
  tripName: string;
  days: Day[];
  firstDayId: string | null;
  memberInitials?: string[];
  isOwner: boolean;
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
      count: days.length ? String(days.length) : undefined,
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
      label: "People",
      href: `/trips/${tripId}/members`,
      icon: Users,
      count: memberInitials?.length ? String(memberInitials.length) : undefined,
      isActive: (p) => p.endsWith("/members"),
    },
  ];

  const onItinerary = pathname.includes(`/trips/${tripId}/day/`);

  return (
    <aside className="bg-sidebar border-sidebar-border hidden shrink-0 flex-col gap-6 border-r px-[18px] py-6 md:flex">
      <span className="font-heading text-[21px] italic">Wanderplan</span>

      <Link
        href="/trips"
        className="text-muted-foreground hover:text-brand font-mono inline-flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase transition-colors duration-150"
      >
        <ArrowLeft className="size-[13px]" />
        <span className="truncate">{tripName}</span>
      </Link>

      <nav className="flex flex-col gap-[3px]">
        {items.map((item) => {
          const active = item.isActive(pathname);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-[4px] px-[11px] py-[9px] text-[13.5px] font-semibold transition-colors duration-150",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
              {item.count && (
                <span
                  className={cn(
                    "font-mono ml-auto text-[10px]",
                    active ? "opacity-60" : "text-muted-foreground"
                  )}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {onItinerary && days.length > 0 && (
        <div className="border-sidebar-border flex flex-col gap-2 border-t border-dashed pt-[18px]">
          <p className="data-label tracking-[0.12em]">Days</p>
          <div className="flex flex-col gap-0.5">
            {days.map((day, i) => {
              const active = pathname === `/trips/${tripId}/day/${day.id}`;
              const { weekday, day: label } = formatDayShort(day.date);
              return (
                <Link
                  key={day.id}
                  href={`/trips/${tripId}/day/${day.id}`}
                  className={cn(
                    "flex items-baseline gap-[9px] rounded-[3px] px-[9px] py-1.5 transition-colors duration-150",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <span className="font-heading w-[18px] text-[15px]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[12px]">
                    {weekday} {label}
                  </span>
                  <span
                    className={cn(
                      "ml-auto size-[5px] rounded-full",
                      day.itemCount === 0
                        ? "bg-transparent"
                        : active
                          ? "bg-sidebar-primary-foreground/70"
                          : "bg-brand/50"
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-sidebar-border mt-auto flex flex-col gap-2.5 border-t border-dashed pt-5">
        {memberInitials && memberInitials.length > 0 && (
          <>
            <p className="data-label tracking-[0.12em]">Travelling with</p>
            <div className="flex items-center">
              {memberInitials.slice(0, 5).map((initial, i) => (
                <span
                  key={i}
                  className="border-sidebar font-heading -ml-2 flex size-7 items-center justify-center rounded-full border-2 text-[13px] text-[oklch(0.98_0.01_85)] first:ml-0"
                  style={{
                    background: [
                      "var(--brand)",
                      "var(--brand-alt)",
                      "var(--brand-third)",
                      "oklch(0.5 0.03 60)",
                      "oklch(0.6 0.13 70)",
                    ][i % 5],
                  }}
                >
                  {initial}
                </span>
              ))}
              <span className="text-muted-foreground ml-2.5 text-[12px]">
                {memberInitials.length} people
              </span>
            </div>
          </>
        )}
        {isOwner && (
          <Link
            href={`/trips/${tripId}/settings`}
            className="text-brand inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
          >
            <Settings className="size-[14px]" />
            Trip settings
          </Link>
        )}
      </div>
    </aside>
  );
}
