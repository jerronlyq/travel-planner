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
