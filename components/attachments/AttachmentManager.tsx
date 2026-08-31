"use client";

import { useItemAttachments } from "@/lib/hooks/use-item-attachments";
import { AttachmentUploader } from "@/components/attachments/AttachmentUploader";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { Skeleton } from "@/components/ui/skeleton";

export function AttachmentManager({
  tripId,
  itemId,
}: {
  tripId: string;
  itemId: string;
}) {
  const { data: attachments, isLoading } = useItemAttachments(itemId);

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      ) : (
        <AttachmentGallery itemId={itemId} attachments={attachments ?? []} />
      )}
      <AttachmentUploader tripId={tripId} itemId={itemId} />
    </div>
  );
}
