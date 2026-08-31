"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "trip-photos";
const SIGNED_URL_TTL_SECONDS = 3600;

export type ItemPhoto = {
  id: string;
  storagePath: string;
  caption: string | null;
  url: string;
};

function photosQueryKey(itemId: string) {
  return ["item_photos", itemId] as const;
}

export function useItemPhotos(itemId: string) {
  return useQuery({
    queryKey: photosQueryKey(itemId),
    queryFn: async (): Promise<ItemPhoto[]> => {
      const supabase = createClient();
      const { data: rows, error } = await supabase
        .from("item_photos")
        .select("id, storage_path, caption")
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
        url: urlByPath.get(r.storage_path) ?? "",
      }));
    },
  });
}

export function useUploadPhoto(tripId: string, itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in.");

      const compressed = await imageCompression(file, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/jpeg",
      });

      const path = `${tripId}/${itemId}/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, compressed, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("item_photos").insert({
        item_id: itemId,
        trip_id: tripId,
        storage_path: path,
        uploaded_by: user.id,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photosQueryKey(itemId) });
    },
  });
}

export function useDeletePhoto(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photo: { id: string; storagePath: string }) => {
      const supabase = createClient();
      await supabase.storage.from(BUCKET).remove([photo.storagePath]);
      const { error } = await supabase.from("item_photos").delete().eq("id", photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photosQueryKey(itemId) });
    },
  });
}
