"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
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

type PhotoData = { urls: string[]; count: number; credit: string | null };

export function DayView({
  tripId,
  dayId,
  dayNumber,
  dayDate,
  createdBy,
  defaultCurrency,
  tripCountry,
  initialItems,
  photosByItem = {},
}: {
  tripId: string;
  dayId: string;
  dayNumber: number;
  dayDate: string;
  createdBy: string;
  defaultCurrency: string;
  tripCountry: string | null;
  initialItems: ItineraryItem[];
  photosByItem?: Record<string, PhotoData>;
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

  const parsed = parseISO(dayDate);

  return (
    <div className="flex flex-col">
      <header className="border-border flex items-start justify-between gap-4 border-b px-6 py-5 md:px-8">
        <div>
          <p className="eyebrow">
            Day {String(dayNumber).padStart(2, "0")} ·{" "}
            {format(parsed, "d MMMM yyyy")}
          </p>
          <h1 className="font-heading mt-0.5 text-[30px] leading-[1.05] font-medium tracking-[-0.02em] md:text-[38px]">
            {format(parsed, "EEEE")}
          </h1>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={openCreate}
            className="bg-primary text-primary-foreground press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold tracking-[0.02em]"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add to this day</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </header>

      <div className="px-6 py-7 md:px-8">
        {items.length === 0 ? (
          <div className="border-border rounded-[4px] border border-dashed px-6 py-16 text-center">
            <p className="font-heading text-[20px]">
              Nothing planned for this day.
            </p>
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
                    {items.map((item) => {
                      const p = photosByItem[item.id];
                      return (
                        <SortableItemCard
                          key={item.id}
                          item={item}
                          onClick={() => openEdit(item)}
                          photos={p?.urls}
                          photoCount={p?.count}
                          photoCredit={p?.credit ?? undefined}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="flex flex-col gap-5">
                {items.map((item) => {
                  const p = photosByItem[item.id];
                  return (
                    <TimelineItem
                      key={item.id}
                      item={item}
                      photos={p?.urls}
                      photoCount={p?.count}
                      photoCredit={p?.credit ?? undefined}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

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
