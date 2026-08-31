"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ItemPhoto } from "@/lib/hooks/use-item-photos";

export function PhotoLightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: ItemPhoto[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const photo = photos[index];
  if (!photo) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[85vh] max-w-3xl items-center justify-center border-none bg-transparent p-0 shadow-none"
      >
        <DialogTitle className="sr-only">Photo</DialogTitle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption ?? ""}
          className="max-h-full max-w-full rounded-lg object-contain"
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 rounded-full bg-background/80 p-2 hover:bg-background"
        >
          <X className="size-4" />
        </button>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => onIndexChange((index - 1 + photos.length) % photos.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 hover:bg-background"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onIndexChange((index + 1) % photos.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 hover:bg-background"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
