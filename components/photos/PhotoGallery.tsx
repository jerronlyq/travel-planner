"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useDeletePhoto, type ItemPhoto } from "@/lib/hooks/use-item-photos";
import { PhotoLightbox } from "@/components/photos/PhotoLightbox";

export function PhotoGallery({ itemId, photos }: { itemId: string; photos: ItemPhoto[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const deletePhoto = useDeletePhoto(itemId);

  async function handleDelete(e: React.MouseEvent, photo: ItemPhoto) {
    e.stopPropagation();
    try {
      await deletePhoto.mutateAsync(photo);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete photo");
    }
  }

  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">No photos yet.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {photos.map((photo, i) => (
          <button
            type="button"
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-md border"
            onClick={() => setLightboxIndex(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.caption ?? ""}
              className="h-full w-full object-cover"
            />
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => handleDelete(e, photo)}
              className="absolute top-1 right-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="size-3" />
            </span>
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
