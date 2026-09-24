"use client";

import { useState } from "react";
import { ExternalLink, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ITEM_TYPE_LABELS, ItemTypeIcon } from "@/components/itinerary/ItemTypeIcon";
import { CURRENCIES } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { PlaceSearchInput } from "@/components/map/PlaceSearchInput";
import { findBestMatch } from "@/lib/geo/search";
import { AttachmentManager } from "@/components/attachments/AttachmentManager";
import { StagedAttachments } from "@/components/attachments/StagedAttachments";
import { uploadItemAttachment } from "@/lib/hooks/use-item-attachments";
import {
  useCreateItineraryItem,
  useDeleteItineraryItem,
  useUpdateItineraryItem,
} from "@/lib/hooks/use-itinerary-items";
import type { Database, ItineraryItemType } from "@/lib/types/database.types";

type ItineraryItem = Database["public"]["Tables"]["itinerary_items"]["Row"];

const ITEM_TYPES = Object.keys(ITEM_TYPE_LABELS) as ItineraryItemType[];

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function fromLocalInputValue(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

export function ItemEditorModal({
  open,
  onOpenChange,
  tripId,
  dayId,
  createdBy,
  defaultCurrency,
  tripCountry,
  proximity = null,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  dayId: string;
  createdBy: string;
  defaultCurrency: string;
  tripCountry: string | null;
  // "lng,lat" of another stop today — biases place suggestions nearby.
  proximity?: string | null;
  item: ItineraryItem | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-[22px] font-medium tracking-[-0.01em]">
            {item ? "Edit stop" : "Add a stop"}
          </DialogTitle>
        </DialogHeader>

        {/* Keyed by item id and mounted only while open, so form state is
            (re)initialized fresh from props with no effect needed. */}
        {open && (
          <ItemEditorForm
            key={item?.id ?? "new"}
            tripId={tripId}
            dayId={dayId}
            createdBy={createdBy}
            defaultCurrency={defaultCurrency}
            tripCountry={tripCountry}
            proximity={proximity}
            item={item}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ItemEditorForm({
  tripId,
  dayId,
  createdBy,
  defaultCurrency,
  tripCountry,
  proximity,
  item,
  onDone,
}: {
  tripId: string;
  dayId: string;
  createdBy: string;
  defaultCurrency: string;
  tripCountry: string | null;
  proximity: string | null;
  item: ItineraryItem | null;
  onDone: () => void;
}) {
  const isEditing = !!item;

  const [type, setType] = useState<ItineraryItemType>(item?.type ?? "activity");
  const [title, setTitle] = useState(item?.title ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [locationName, setLocationName] = useState(item?.location_name ?? "");
  const [locationAddress, setLocationAddress] = useState(item?.location_address ?? "");
  const [lat, setLat] = useState(item?.lat ?? null);
  const [lng, setLng] = useState(item?.lng ?? null);
  // Which field produced the current pin — editing that field clears it.
  const [pinSource, setPinSource] = useState<"place" | "address" | null>(
    item?.lat != null && item?.lng != null ? "place" : null
  );
  const [locating, setLocating] = useState(false);
  const [allDay, setAllDay] = useState(item?.all_day ?? false);
  const [startTime, setStartTime] = useState(toLocalInputValue(item?.start_time ?? null));
  const [endTime, setEndTime] = useState(toLocalInputValue(item?.end_time ?? null));
  const [priceAmount, setPriceAmount] = useState(
    item?.price_amount != null ? String(item.price_amount) : ""
  );
  const [priceCurrency, setPriceCurrency] = useState(item?.price_currency ?? defaultCurrency);
  const [url, setUrl] = useState(item?.url ?? "");
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  const create = useCreateItineraryItem(dayId);
  const update = useUpdateItineraryItem(dayId);
  const remove = useDeleteItineraryItem(dayId);

  const pinned = lat !== null && lng !== null;

  // Geocode free text when nothing was picked: the address first (most
  // precise), then the place name.
  async function locateFromText() {
    return findBestMatch(
      [
        { text: locationAddress, mode: "address" },
        { text: locationName, mode: "poi" },
      ],
      {
        country: tripCountry,
        proximity,
      }
    );
  }

  async function handleFindOnMap() {
    if (!locationAddress.trim() && !locationName.trim()) {
      toast.error("Enter a location or an address first.");
      return;
    }
    setLocating(true);
    const hit = await locateFromText();
    setLocating(false);
    if (!hit) {
      toast.error(
        "Couldn't find that on the map. Check the spelling, or add more of the address (street, city)."
      );
      return;
    }
    setLat(hit.result.lat);
    setLng(hit.result.lng);
    setPinSource(hit.textIndex === 0 ? "address" : "place");
    if (!locationAddress.trim()) setLocationAddress(hit.result.fullAddress);
    toast.success(
      `${hit.approximate ? "Pinned near" : "Pinned to"} ${hit.result.fullAddress}`
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Nothing picked from the dropdown? Fall back to the typed address.
    let finalLat = lat;
    let finalLng = lng;
    let finalAddress = locationAddress;
    let autoPinned: string | null = null;
    let couldNotPin = false;
    if (
      (finalLat === null || finalLng === null) &&
      (locationAddress.trim() || locationName.trim())
    ) {
      setLocating(true);
      const hit = await locateFromText();
      setLocating(false);
      if (hit) {
        finalLat = hit.result.lat;
        finalLng = hit.result.lng;
        if (!finalAddress.trim()) finalAddress = hit.result.fullAddress;
        autoPinned = `${hit.approximate ? "Pinned near" : "Pinned to"} ${hit.result.fullAddress}`;
      } else {
        couldNotPin = true;
      }
    }

    const payload = {
      type,
      title,
      notes: notes || null,
      location_name: locationName || null,
      location_address: finalAddress || null,
      lat: finalLat,
      lng: finalLng,
      all_day: allDay,
      start_time: allDay ? null : fromLocalInputValue(startTime),
      end_time: allDay ? null : fromLocalInputValue(endTime),
      price_amount: priceAmount ? Number(priceAmount) : null,
      price_currency: priceAmount ? priceCurrency : null,
      url: url || null,
    };

    try {
      if (isEditing) {
        await update.mutateAsync({ id: item.id, ...payload });
        toast.success("Item updated");
      } else {
        const newItem = await create.mutateAsync({
          trip_id: tripId,
          day_id: dayId,
          created_by: createdBy,
          ...payload,
        });
        if (stagedFiles.length > 0) {
          const results = await Promise.allSettled(
            stagedFiles.map((file) =>
              uploadItemAttachment(tripId, newItem.id, file)
            )
          );
          const failed = results.filter((r) => r.status === "rejected").length;
          if (failed > 0) {
            toast.error(
              `Item added, but ${failed} file${failed > 1 ? "s" : ""} failed to upload`
            );
          } else {
            toast.success("Item added");
          }
        } else {
          toast.success("Item added");
        }
      }
      if (autoPinned) toast(autoPinned);
      if (couldNotPin) {
        toast.warning(
          "Saved, but couldn't find that location on the map. Edit the item to add a fuller address."
        );
      }
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleDelete() {
    if (!item) return;
    try {
      await remove.mutateAsync(item.id);
      toast.success("Item removed");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const saving = create.isPending || update.isPending || locating;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="title" className={LABEL}>
              Title
            </Label>
            <Input
              id="title"
              required
              className="font-heading h-9 text-[18px]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={LABEL}>Type</Label>
            <div className="flex flex-wrap gap-1.5">
              {ITEM_TYPES.map((t) => {
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setType(t)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-brand hover:text-foreground"
                    )}
                  >
                    <ItemTypeIcon type={t} className="size-3.5" />
                    {ITEM_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location_name" className={LABEL}>
              Location
            </Label>
            <PlaceSearchInput
              mode="poi"
              value={locationName}
              placeholder="Search a place, e.g. Tokyo Tower"
              country={tripCountry}
              proximity={proximity}
              emptyHint="No place found. Enter the street address below and use “Find on map”."
              onChange={(v) => {
                setLocationName(v);
                if (pinSource === "place") {
                  setLat(null);
                  setLng(null);
                  setPinSource(null);
                }
              }}
              onSelect={(result) => {
                setLocationName(result.name);
                setLocationAddress(result.fullAddress);
                setLat(result.lat);
                setLng(result.lng);
                setPinSource("place");
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location_address" className={LABEL}>
              Address
            </Label>
            <PlaceSearchInput
              mode="address"
              value={locationAddress}
              placeholder="Street address — used to pin it if the place isn't found"
              country={tripCountry}
              proximity={proximity}
              emptyHint="No address found. Try adding the city or postcode."
              onChange={(v) => {
                setLocationAddress(v);
                if (pinSource === "address") {
                  setLat(null);
                  setLng(null);
                  setPinSource(null);
                }
              }}
              onSelect={(result) => {
                setLocationAddress(result.fullAddress);
                setLat(result.lat);
                setLng(result.lng);
                setPinSource("address");
              }}
            />

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5">
              {pinned ? (
                <>
                  <span className="text-brand inline-flex items-center gap-1 text-[12px] font-semibold">
                    <MapPin className="size-3.5" />
                    Pinned on the map
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[12px] underline underline-offset-2"
                  >
                    <ExternalLink className="size-3" />
                    Check location
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setLat(null);
                      setLng(null);
                      setPinSource(null);
                    }}
                    className="text-muted-foreground hover:text-destructive text-[12px] underline underline-offset-2"
                  >
                    Remove pin
                  </button>
                </>
              ) : (
                <>
                  <span className="text-muted-foreground text-[12px]">
                    Not on the map yet.
                  </span>
                  <button
                    type="button"
                    onClick={handleFindOnMap}
                    disabled={locating}
                    className="border-border hover:border-brand inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition-colors disabled:opacity-50"
                  >
                    {locating ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <MapPin className="size-3" />
                    )}
                    Find on map
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="all_day"
              type="checkbox"
              className="accent-brand size-4"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            <Label htmlFor="all_day" className="text-[13px] font-normal">
              All day / no specific time
            </Label>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start_time" className={LABEL}>
                  Start
                </Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  className="font-mono text-[13px]"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_time" className={LABEL}>
                  End
                </Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  className="font-mono text-[13px]"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-[1fr_auto] gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price_amount" className={LABEL}>
                Price (optional)
              </Label>
              <Input
                id="price_amount"
                type="number"
                step="0.01"
                min="0"
                className="font-mono text-[13px]"
                value={priceAmount}
                onChange={(e) => setPriceAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price_currency" className={LABEL}>
                Currency
              </Label>
              <Select
                value={priceCurrency}
                onValueChange={(v) => v && setPriceCurrency(v)}
              >
                <SelectTrigger id="price_currency" className="w-24 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="url" className={LABEL}>
              Link
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={LABEL}>Attachments</Label>
            {item ? (
              <AttachmentManager tripId={tripId} itemId={item.id} />
            ) : (
              <StagedAttachments files={stagedFiles} onChange={setStagedFiles} />
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className={LABEL}>
              Notes
            </Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {isEditing ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={remove.isPending}
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={saving}>
              {locating
                ? "Finding location…"
                : saving
                  ? "Saving…"
                  : isEditing
                    ? "Save changes"
                    : "Add stop"}
            </Button>
          </DialogFooter>
        </form>
  );
}

const LABEL =
  "font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground";
