import Link from "next/link";
import { Plus, Share2 } from "lucide-react";
import { formatDateRangeShort } from "@/lib/utils/dates";

/**
 * Editorial hero. Renders on the OVERVIEW tab only — the other tabs get their
 * own mastheads so the photo does not repeat on every screen.
 */
export function TripHeader({
  tripId,
  name,
  destination,
  startDate,
  endDate,
  dayCount,
  canEdit,
  coverUrl,
}: {
  tripId: string;
  name: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  dayCount: number;
  canEdit: boolean;
  coverUrl?: string | null;
}) {
  const dates = formatDateRangeShort(startDate, endDate);
  const kicker = [destination, dayCount > 0 ? `${dayCount} days` : null, dates]
    .filter(Boolean)
    .join(" — ");

  return (
    <div
      className={`relative h-40 overflow-hidden md:h-[216px] ${coverUrl ? "" : "stripe-photo"}`}
    >
      {coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.28_0.05_50/0.15)] to-[oklch(0.28_0.05_50/0.66)]" />

      {!coverUrl && (
        <span className="font-mono absolute top-4 right-8 hidden text-[9px] tracking-[0.08em] text-[oklch(0.97_0.01_85/0.8)] md:inline">
          Photo — destination banner
        </span>
      )}

      <div className="absolute inset-x-4 bottom-5 flex items-end justify-between gap-5 sm:inset-x-8">
        <div className="min-w-0 text-[oklch(0.98_0.01_85)]">
          {kicker && (
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-85">
              {kicker}
            </p>
          )}
          <h1 className="font-heading mt-1.5 truncate text-[32px] leading-[1.02] font-medium tracking-[-0.025em] md:text-[52px]">
            {name}
          </h1>
        </div>

        <div className="flex shrink-0 gap-2">
          <Link
            href={`/trips/${tripId}/members`}
            className="inline-flex h-9 items-center gap-[7px] rounded-full bg-[oklch(0.97_0.012_85)] px-[15px] text-[13px] font-semibold text-[oklch(0.35_0.04_50)] transition-transform duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-safe:hover:-translate-y-0.5"
          >
            <Share2 className="size-[15px]" />
            <span className="hidden sm:inline">Share</span>
          </Link>
          {canEdit && (
            <Link
              href={`/trips/${tripId}`}
              className="bg-brand inline-flex h-9 items-center gap-[7px] rounded-full px-[15px] text-[13px] font-semibold text-[oklch(0.98_0.01_85)] transition-transform duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-safe:hover:-translate-y-0.5"
            >
              <Plus className="size-[15px]" />
              <span className="hidden sm:inline">Add plan</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
