import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

export function dateRange(startDate: string, endDate: string): string[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = differenceInCalendarDays(end, start);
  if (days < 0) return [];

  return Array.from({ length: days + 1 }, (_, i) =>
    format(addDays(start, i), "yyyy-MM-dd")
  );
}

export function formatDayLabel(date: string, dayNumber: number): string {
  return `Day ${dayNumber} · ${format(parseISO(date), "EEE, MMM d")}`;
}

export function formatDayShort(date: string): { weekday: string; day: string } {
  const d = parseISO(date);
  return { weekday: format(d, "EEE"), day: format(d, "MMM d") };
}

// "Apr 3 – 11, 2027" / "Dec 30, 2026 – Jan 4, 2027" / "" when dates missing.
export function formatDateRangeShort(
  startDate: string | null,
  endDate: string | null
): string {
  if (!startDate && !endDate) return "";
  if (startDate && !endDate) return format(parseISO(startDate), "MMM d, yyyy");
  if (!startDate && endDate) return format(parseISO(endDate), "MMM d, yyyy");

  const start = parseISO(startDate as string);
  const end = parseISO(endDate as string);
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
  }
  if (sameYear) {
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

export function formatTimeRange(
  startTime: string | null,
  endTime: string | null,
  allDay: boolean
): string | null {
  if (allDay) return "All day";
  if (!startTime) return null;
  const start = format(parseISO(startTime), "h:mm a");
  if (!endTime) return start;
  return `${start} – ${format(parseISO(endTime), "h:mm a")}`;
}
