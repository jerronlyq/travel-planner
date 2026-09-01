"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TimelineItem } from "@/components/itinerary/TimelineItem";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database.types";

type ItineraryItem = Database["public"]["Tables"]["itinerary_items"]["Row"];

export function SortableItemCard({
  item,
  onClick,
  photos,
  photoCount,
  photoCredit,
}: {
  item: ItineraryItem;
  onClick?: () => void;
  photos?: string[];
  photoCount?: number;
  photoCredit?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10")}
    >
      {/* Grab affordance sits over the timeline dot */}
      <button
        type="button"
        aria-label="Reorder item"
        className="focus-visible:ring-ring/50 absolute top-0 -left-[32px] z-10 size-5 cursor-grab touch-none rounded-full outline-none focus-visible:ring-2 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      />
      <TimelineItem
        item={item}
        onClick={onClick}
        isDragging={isDragging}
        photos={photos}
        photoCount={photoCount}
        photoCredit={photoCredit}
      />
    </div>
  );
}
