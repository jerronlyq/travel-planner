"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/itinerary/ItemCard";
import { ItemEditorModal } from "@/components/itinerary/ItemEditorModal";
import { useItineraryItems } from "@/lib/hooks/use-itinerary-items";
import type { Database } from "@/lib/types/database.types";

type ItineraryItem = Database["public"]["Tables"]["itinerary_items"]["Row"];

export function DayView({
  tripId,
  dayId,
  createdBy,
  defaultCurrency,
  initialItems,
}: {
  tripId: string;
  dayId: string;
  createdBy: string;
  defaultCurrency: string;
  initialItems: ItineraryItem[];
}) {
  const { data: items } = useItineraryItems(dayId, initialItems);
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<ItineraryItem | null>(null);

  function openCreate() {
    setActiveItem(null);
    setEditorOpen(true);
  }

  function openEdit(item: ItineraryItem) {
    setActiveItem(item);
    setEditorOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <div className="mb-4 flex items-center justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Add item
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => openEdit(item)} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Nothing planned for this day yet.
        </div>
      )}

      <ItemEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        tripId={tripId}
        dayId={dayId}
        createdBy={createdBy}
        defaultCurrency={defaultCurrency}
        item={activeItem}
      />
    </div>
  );
}
