"use client";

import { useItemPhotos } from "@/lib/hooks/use-item-photos";
import { PhotoUploader } from "@/components/photos/PhotoUploader";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { Skeleton } from "@/components/ui/skeleton";

export function PhotoManager({ tripId, itemId }: { tripId: string; itemId: string }) {
  const { data: photos, isLoading } = useItemPhotos(itemId);

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      ) : (
        <PhotoGallery itemId={itemId} photos={photos ?? []} />
      )}
      <PhotoUploader tripId={tripId} itemId={itemId} />
    </div>
  );
}
