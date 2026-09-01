import Link from "next/link";
import { format, parseISO, isBefore } from "date-fns";
import type { Database } from "@/lib/types/database.types";

type Trip = Database["public"]["Tables"]["trips"]["Row"];

function status(trip: Trip): string {
  if (!trip.start_date) return "Draft";
  if (isBefore(parseISO(trip.start_date), new Date())) return "Past";
  return "Upcoming";
}

export function TripCard({
  trip,
  coverUrl,
}: {
  trip: Trip;
  coverUrl?: string | null;
}) {
  const dates =
    trip.start_date && trip.end_date
      ? `${format(parseISO(trip.start_date), "MMM d")} – ${format(parseISO(trip.end_date), "d")}`
      : "Dates open";

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group focus-visible:ring-ring/50 flex flex-col gap-3 rounded-[3px] outline-none transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-safe:hover:-translate-y-1"
    >
      <div
        className={`${coverUrl ? "" : "stripe-photo"} shadow-lift relative h-[194px] overflow-hidden rounded-[3px]`}
      >
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[oklch(0.3_0.05_50/0.45)]" />

        {/* Scrapbook tape */}
        <div className="bg-tape absolute -top-[9px] left-1/2 h-[19px] w-[62px] -translate-x-1/2 rotate-[-2deg] border-x border-dashed border-[oklch(0.8_0.05_95)]" />

        <span className="font-mono absolute top-3 right-3 rounded-full bg-[oklch(0.97_0.012_85/0.92)] px-[7px] py-1 text-[9px] tracking-[0.1em] uppercase text-[oklch(0.35_0.04_50)]">
          {status(trip)}
        </span>

        {!coverUrl && (
          <span className="font-mono absolute bottom-[11px] left-3 text-[9px] tracking-[0.08em] text-[oklch(0.97_0.01_85/0.85)]">
            Photo — hero shot
          </span>
        )}
      </div>

      <div className="flex flex-col gap-[3px]">
        <h3 className="font-heading text-[22px] leading-[1.15] font-medium tracking-[-0.01em]">
          {trip.name}
        </h3>
        <p className="text-muted-foreground text-[12.5px]">
          {trip.destination ?? "Destination undecided"}
        </p>
        <p className="font-mono text-brand text-[10px] tracking-[0.08em] uppercase">
          {dates}
        </p>
      </div>
    </Link>
  );
}
