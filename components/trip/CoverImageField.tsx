"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "trip-photos";

export function CoverImageField({
  tripId,
  currentPath,
  currentUrl,
}: {
  tripId: string;
  currentPath: string | null;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const compressed = await imageCompression(file, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1800,
        useWebWorker: true,
        fileType: "image/jpeg",
      });
      const path = `${tripId}/cover/${crypto.randomUUID()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, compressed, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("trips")
        .update({ cover_photo_path: path })
        .eq("id", tripId);
      if (updateError) throw updateError;

      if (currentPath) {
        await supabase.storage.from(BUCKET).remove([currentPath]);
      }

      toast.success("Cover photo updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("trips")
        .update({ cover_photo_path: null })
        .eq("id", tripId);
      if (error) throw error;
      if (currentPath) {
        await supabase.storage.from(BUCKET).remove([currentPath]);
      }
      toast.success("Cover photo removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="border-border h-[64px] w-[110px] shrink-0 overflow-hidden rounded-[3px] border">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt="Trip cover"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="stripe-photo h-full w-full" />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="border-border hover:border-brand inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-colors disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-[13px] animate-spin" />
          ) : (
            <ImagePlus className="size-[13px]" />
          )}
          {currentUrl ? "Replace photo" : "Upload photo"}
        </button>
        {currentUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={handleRemove}
            className="text-destructive inline-flex w-fit items-center gap-1 text-[12px] font-semibold underline underline-offset-2 disabled:opacity-50"
          >
            <Trash2 className="size-[12px]" />
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
