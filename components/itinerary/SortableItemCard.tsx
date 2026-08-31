"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ItemCard } from "@/components/itinerary/ItemCard";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database.types";

type ItineraryItem = Database["public"]["Tables"]["itinerary_items"]["Row"];

export function SortableItemCard({
  item,
  onClick,
}: {
  item: ItineraryItem;
  onClick?: () => void;
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
      className={cn("relative", isDragging && "z-10 opacity-80")}
    >
      <button
        type="button"
        aria-label="Reorder item"
        className="absolute top-1/2 -left-1 z-10 -translate-y-1/2 cursor-grab touch-none rounded p-1 text-muted-foreground opacity-40 transition-opacity hover:bg-accent hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <ItemCard item={item} onClick={onClick} />
    </div>
  );
}
