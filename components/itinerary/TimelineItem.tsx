import { MapPin, Paperclip } from "lucide-react";
import { ItemTypeIcon, ITEM_TYPE_LABELS } from "@/components/itinerary/ItemTypeIcon";
import { formatTimeRange } from "@/lib/utils/dates";
import { formatPrice } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { Database, ItineraryItemType } from "@/lib/types/database.types";

type ItineraryItem = Database["public"]["Tables"]["itinerary_items"]["Row"];

/** Accent per item type — all share chroma/lightness, hue only varies. */
const TYPE_COLOR: Record<ItineraryItemType, string> = {
  transport: "var(--brand-alt)",
  place: "var(--brand-third)",
  accommodation: "var(--brand)",
  food: "oklch(0.6 0.13 70)",
  activity: "oklch(0.58 0.14 300)",
};

/**
 * One stop on the day timeline. Replaces ItemCard inside DayView.
 * DayView wraps the list in:
 *   <div className="relative pl-[26px]">
 *     <div className="dashed-rule-y absolute top-2 bottom-3 left-1 w-[1.5px]" />
 *     <div className="flex flex-col gap-5"> ...items... </div>
 *   </div>
 */
export function TimelineItem({
  item,
  photoCount = 0,
  photoCredit,
  photos,
  onClick,
  isDragging,
}: {
  item: ItineraryItem;
  photoCount?: number;
  photoCredit?: string;
  photos?: string[];
  onClick?: () => void;
  isDragging?: boolean;
}) {
  const time = formatTimeRange(item.start_time, item.end_time, item.all_day);
  const price = formatPrice(item.price_amount, item.price_currency);
  const color = TYPE_COLOR[item.type];

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        onClick && "cursor-pointer motion-safe:hover:translate-x-[3px]",
        isDragging && "opacity-60"
      )}
    >
      {/* Timeline dot — also the drag affordance */}
      <span
        className="bg-background absolute top-1 -left-[26px] size-[11px] rounded-full border-2"
        style={{ borderColor: color }}
      />

      <div className="flex items-baseline gap-2.5">
        {time && (
          <span
            className="text-muted-foreground font-mono text-[11px] tracking-[0.06em]"
            suppressHydrationWarning
          >
            {time}
          </span>
        )}
        <span
          className="font-mono inline-flex items-center gap-1.5 text-[9.5px] tracking-[0.12em] uppercase"
          style={{ color }}
        >
          <ItemTypeIcon type={item.type} className="size-3" />
          {ITEM_TYPE_LABELS[item.type]}
        </span>
      </div>

      <div className="mt-[3px] flex items-baseline justify-between gap-3.5">
        <h3 className="font-heading text-[23px] leading-[1.2] font-medium tracking-[-0.01em]">
          {item.title}
        </h3>
        {price && (
          <span className="font-mono shrink-0 text-[12px] whitespace-nowrap">{price}</span>
        )}
      </div>

      {item.location_name && (
        <p className="text-muted-foreground mt-[3px] flex items-center gap-1 text-[13px]">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{item.location_name}</span>
        </p>
      )}

      {item.notes && (
        <p className="mt-1.5 max-w-[46ch] text-[13.5px] leading-[1.55] text-[oklch(0.4_0.02_58)] dark:text-[oklch(0.8_0.012_80)]">
          {item.notes}
        </p>
      )}

      {photoCount > 0 && (
        <div className="mt-2.5 flex items-end gap-2.5">
          {[0, 1].map((i) => {
            if (i === 1 && photoCount <= 1) return null;
            const url = photos?.[i];
            const rot = i === 0 ? "rotate-[-1.6deg]" : "rotate-[1.2deg]";
            return url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                className={cn(
                  "shadow-lift h-[78px] w-[116px] shrink-0 rounded-[2px] object-cover",
                  rot
                )}
              />
            ) : (
              <div
                key={i}
                className={cn(
                  "shadow-lift h-[78px] w-[116px] shrink-0 rounded-[2px] bg-[repeating-linear-gradient(38deg,oklch(0.68_0.09_195)_0_8px,oklch(0.62_0.1_192)_8px_16px)]",
                  rot
                )}
              />
            );
          })}
          <span className="font-mono text-muted-foreground flex items-center gap-1 text-[9px] tracking-[0.08em] uppercase">
            <Paperclip className="size-3" />
            {photoCount} {photoCount === 1 ? "photo" : "photos"}
            {photoCredit ? ` from ${photoCredit}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
