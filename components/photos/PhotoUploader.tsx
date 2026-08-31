"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadPhoto } from "@/lib/hooks/use-item-photos";

export function PhotoUploader({ tripId, itemId }: { tripId: string; itemId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadPhoto(tripId, itemId);
  const [uploadingCount, setUploadingCount] = useState(0);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setUploadingCount(list.length);

    for (const file of list) {
      try {
        await upload.mutateAsync(file);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to upload photo");
      }
    }

    setUploadingCount(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  const busy = uploadingCount > 0;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ImagePlus className="size-4" />
        )}
        {busy ? "Uploading..." : "Add photos"}
      </Button>
    </div>
  );
}
