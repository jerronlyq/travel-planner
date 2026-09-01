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
import { TimelineItem } from "@/components/itinerary/TimelineItem";
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
    <div className="mx-auto w-full max-w-3xl px-6 py-7 md:px-8">
      {canEdit && (
        <div className="mb-6 flex items-center justify-end">
          <button
            type="button"
            onClick={openCreate}
            className="bg-primary text-primary-foreground press inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold"
          >
            <Plus className="size-4" />
            Add to this day
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="border-border rounded-[4px] border border-dashed px-6 py-16 text-center">
          <p className="font-heading text-[20px]">Nothing planned for this day.</p>
          {canEdit && (
            <p className="text-muted-foreground mt-1 text-[13.5px]">
              Add a stop and it drops onto the timeline.
            </p>
          )}
        </div>
      ) : (
        <div className="relative pl-[26px]">
          <div className="dashed-rule-y absolute top-2 bottom-3 left-1 w-[1.5px]" />
          {canEdit ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((it) => it.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-5">
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
            <div className="flex flex-col gap-5">
              {items.map((item) => (
                <TimelineItem key={item.id} item={item} />
              ))}
            </div>
          )}
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
