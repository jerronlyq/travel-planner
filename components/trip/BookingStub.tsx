import Link from "next/link";
import { ExternalLink, Paperclip } from "lucide-react";
import { ItemTypeIcon, ITEM_TYPE_LABELS } from "@/components/itinerary/ItemTypeIcon";
import { formatTimeRange } from "@/lib/utils/dates";
import { formatPrice } from "@/lib/utils/currency";
import type { Database, ItineraryItemType } from "@/lib/types/database.types";

type ItineraryItem = Database["public"]["Tables"]["itinerary_items"]["Row"];
type AttachmentLink = { id: string; fileName: string; url: string };

const TYPE_COLOR: Record<ItineraryItemType, string> = {
  transport: "var(--brand-alt)",
  place: "var(--brand-third)",
  accommodation: "var(--brand)",
  food: "oklch(0.6 0.13 70)",
  activity: "oklch(0.58 0.14 300)",
};

/**
 * Perforated ticket stub. Replaces the local BookingCard in the bookings page.
 *
 * IMPORTANT: no overflow-hidden on the outer card — it clips the punched
 * notches. The notch circles are page-background coloured with a 1px border
 * and straddle the dashed divider at the card's top and bottom edges.
 */
export function BookingStub({
  tripId,
  item,
  dayLabel,
  attachments,
}: {
  tripId: string;
  item: ItineraryItem;
  dayLabel: string;
  attachments: AttachmentLink[];
}) {
  const time = formatTimeRange(item.start_time, item.end_time, item.all_day);
  const price = formatPrice(item.price_amount, item.price_currency);
  const color = TYPE_COLOR[item.type];
  const isStay = item.type === "accommodation";

  return (
    <div className="bg-card border-border shadow-[0_3px_0_var(--border)] hover:shadow-lift relative grid grid-cols-[1fr_128px] rounded-[4px] border transition-[transform,box-shadow] duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-safe:hover:-translate-y-[3px]">
      <div className="min-w-0 px-[17px] py-[15px]">
        <div className="flex items-center gap-2">
          <ItemTypeIcon type={item.type} className="size-3.5" style={{ color }} />
          <span
            className="font-mono text-[9.5px] tracking-[0.14em] uppercase"
            style={{ color }}
          >
            {ITEM_TYPE_LABELS[item.type]}
          </span>
          <span className="font-mono text-muted-foreground text-[9.5px] tracking-[0.1em] uppercase">
            · {dayLabel}
          </span>
        </div>

        <h3 className="font-heading mt-[5px] text-[22px] font-medium tracking-[-0.01em]">
          {item.title}
        </h3>

        {item.location_name && (
          <p className="text-muted-foreground mt-0.5 truncate text-[12.5px]">
            {item.location_name}
          </p>
        )}

        <div className="mt-[9px] flex flex-wrap gap-3.5">
          {attachments.map((file) => (
            <a
              key={file.id}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold underline underline-offset-2"
            >
              <Paperclip className="size-[13px]" />
              {file.fileName}
            </a>
          ))}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold underline underline-offset-2"
            >
              <ExternalLink className="size-[13px]" />
              Booking page
            </a>
          )}
          {item.day_id && (
            <Link
              href={`/trips/${tripId}/day/${item.day_id}`}
              className="text-muted-foreground hover:text-brand inline-flex items-center gap-1.5 text-[12px] font-semibold"
            >
              In the itinerary
            </Link>
          )}
        </div>
      </div>

      {/* Stub */}
      <div className="border-border bg-muted relative flex flex-col justify-between rounded-r-[4px] border-l-2 border-dashed px-3.5 py-[15px] text-right">
        <div>
          <p className="data-label tracking-[0.1em]">{isStay ? "Check-in" : "Departs"}</p>
          <p className="font-mono mt-[3px] text-[12.5px]">{time || "—"}</p>
        </div>
        {price && <p className="font-heading text-[20px] tracking-[-0.01em]">{price}</p>}

        {/* Punched perforations */}
        <span className="bg-background border-border absolute -top-2 -left-2 size-3.5 rounded-full border" />
        <span className="bg-background border-border absolute -bottom-2 -left-2 size-3.5 rounded-full border" />
      </div>
    </div>
  );
}
