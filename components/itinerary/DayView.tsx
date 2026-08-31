"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/itinerary/ItemCard";
import { SortableItemCard } from "@/components/itinerary/SortableItemCard";
import { ItemEditorModal } from "@/components/itinerary/ItemEditorModal";
import {
  useItineraryItems,
  useReorderItineraryItems,
} from "@/lib/hooks/use-itinerary-items";
import { useCanEdit } from "@/components/trip/TripRoleContext";
import type { Database } from "@/lib/types/database.types";

type ItineraryItem = Database["public"]["Tables"]["itinerary_items"]["Row"];

export function DayView({
  tripId,
  dayId,
  createdBy,
  defaultCurrency,
  tripCountry,
  initialItems,
}: {
  tripId: string;
  dayId: string;
  createdBy: string;
  defaultCurrency: string;
  tripCountry: string | null;
  initialItems: ItineraryItem[];
}) {
  const { data: items } = useItineraryItems(dayId, initialItems);
  const reorder = useReorderItineraryItems(dayId);
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<ItineraryItem | null>(null);
  const canEdit = useCanEdit();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function openCreate() {
    setActiveItem(null);
    setEditorOpen(true);
  }

  function openEdit(item: ItineraryItem) {
    if (!canEdit) return;
    setActiveItem(item);
    setEditorOpen(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = items.map((it) => it.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    reorder.mutate(arrayMove(ids, oldIndex, newIndex));
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      {canEdit && (
        <div className="mb-4 flex items-center justify-end">
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Add item
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Nothing planned for this day yet.
        </div>
      ) : canEdit ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((it) => it.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {items.map((item) => (
                <SortableItemCard
                  key={item.id}
                  item={item}
                  onClick={() => openEdit(item)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {canEdit && (
        <ItemEditorModal
          open={editorOpen}
          onOpenChange={setEditorOpen}
          tripId={tripId}
          dayId={dayId}
          createdBy={createdBy}
          defaultCurrency={defaultCurrency}
          tripCountry={tripCountry}
          item={activeItem}
        />
      )}
    </div>
  );
}
