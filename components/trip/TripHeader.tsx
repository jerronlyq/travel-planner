import Link from "next/link";
import { ChevronLeft, MapPin, Settings } from "lucide-react";
import { formatDateRangeShort } from "@/lib/utils/dates";

export function TripHeader({
  tripId,
  name,
  destination,
  startDate,
  endDate,
  isOwner,
}: {
  tripId: string;
  name: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  isOwner: boolean;
}) {
  const dates = formatDateRangeShort(startDate, endDate);

  return (
    <div className="relative overflow-hidden border-b">
      <div
        aria-hidden
        className="from-primary/25 via-sky/20 to-primary/10 absolute inset-0 bg-gradient-to-r"
      />
      <div
        aria-hidden
        className="bg-background/40 absolute inset-0 backdrop-blur-[2px]"
      />
      <div className="relative mx-auto w-full max-w-5xl px-4 pt-3 pb-4 sm:px-6">
        <Link
          href="/trips"
          className="text-muted-foreground hover:text-foreground -ml-1 inline-flex items-center gap-1 text-xs font-medium transition-colors"
        >
          <ChevronLeft className="size-3.5" />
          All trips
        </Link>

        <div className="mt-1.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {name}
            </h1>
            <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
              {destination && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {destination}
                </span>
              )}
              {dates && <span>{dates}</span>}
            </div>
          </div>

          {isOwner && (
            <Link
              href={`/trips/${tripId}/settings`}
              aria-label="Trip settings"
              className="bg-background/70 text-muted-foreground hover:text-foreground hover:bg-background inline-flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors"
            >
              <Settings className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
