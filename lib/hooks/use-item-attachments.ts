"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "trip-photos";
const SIGNED_URL_TTL_SECONDS = 3600;

export type ItemAttachment = {
  id: string;
  storagePath: string;
  caption: string | null;
  mimeType: string | null;
  fileName: string | null;
  isImage: boolean;
  url: string;
};

function attachmentsQueryKey(itemId: string) {
  return ["item_attachments", itemId] as const;
}

export function useItemAttachments(itemId: string) {
  return useQuery({
    queryKey: attachmentsQueryKey(itemId),
    queryFn: async (): Promise<ItemAttachment[]> => {
      const supabase = createClient();
      const { data: rows, error } = await supabase
        .from("item_attachments")
        .select("id, storage_path, caption, mime_type, file_name")
        .eq("item_id", itemId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      if (!rows || rows.length === 0) return [];

      const paths = rows.map((r) => r.storage_path);
      const { data: signed, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

      if (signError) throw signError;

      const urlByPath = new Map(signed?.map((s) => [s.path, s.signedUrl]));

      return rows.map((r) => ({
        id: r.id,
        storagePath: r.storage_path,
        caption: r.caption,
        mimeType: r.mime_type,
        fileName: r.file_name,
        isImage: (r.mime_type ?? "").startsWith("image/"),
        url: urlByPath.get(r.storage_path) ?? "",
      }));
    },
  });
}

// Compress (images only), upload to storage, and insert the row. Usable
// outside a hook — e.g. flushing files staged while creating a new item.
export async function uploadItemAttachment(
  tripId: string,
  itemId: string,
  file: File
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const isImage = file.type.startsWith("image/");

  let body: Blob = file;
  let mimeType = file.type || "application/octet-stream";
  let fileName = file.name;

  if (isImage) {
    body = await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: "image/jpeg",
    });
    mimeType = "image/jpeg";
    fileName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  }

  const path = `${tripId}/${itemId}/${crypto.randomUUID()}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType: mimeType });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from("item_attachments").insert({
    item_id: itemId,
    trip_id: tripId,
    storage_path: path,
    mime_type: mimeType,
    file_name: fileName,
    uploaded_by: user.id,
  });
  if (insertError) throw insertError;
}

export function useUploadAttachment(tripId: string, itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadItemAttachment(tripId, itemId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentsQueryKey(itemId) });
    },
  });
}

export function useDeleteAttachment(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachment: { id: string; storagePath: string }) => {
      const supabase = createClient();
      await supabase.storage.from(BUCKET).remove([attachment.storagePath]);
      const { error } = await supabase
        .from("item_attachments")
        .delete()
        .eq("id", attachment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentsQueryKey(itemId) });
    },
  });
}
