"use client";

import { useState } from "react";
import { FileText, X } from "lucide-react";
import { toast } from "sonner";
import {
  useDeleteAttachment,
  type ItemAttachment,
} from "@/lib/hooks/use-item-attachments";
import { AttachmentLightbox } from "@/components/attachments/AttachmentLightbox";

export function AttachmentGallery({
  itemId,
  attachments,
}: {
  itemId: string;
  attachments: ItemAttachment[];
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const deleteAttachment = useDeleteAttachment(itemId);

  const images = attachments.filter((a) => a.isImage);
  const files = attachments.filter((a) => !a.isImage);

  async function handleDelete(e: React.MouseEvent, attachment: ItemAttachment) {
    e.stopPropagation();
    e.preventDefault();
    try {
      await deleteAttachment.mutateAsync(attachment);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete attachment"
      );
    }
  }

  if (attachments.length === 0) {
    return <p className="text-sm text-muted-foreground">No attachments yet.</p>;
  }

  return (
    <>
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, i) => (
            <button
              type="button"
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-md border"
              onClick={() => setLightboxIndex(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.caption ?? ""}
                className="h-full w-full object-cover"
              />
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => handleDelete(e, image)}
                className="absolute top-1 right-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3" />
              </span>
            </button>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file) => (
            <li key={file.id}>
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate text-primary underline"
                >
                  {file.fileName ?? "Attachment"}
                </a>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, file)}
                  className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-accent"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {lightboxIndex !== null && images.length > 0 && (
        <AttachmentLightbox
          images={images}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
