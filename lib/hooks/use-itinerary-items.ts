"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database.types";

type ItineraryItem = Database["public"]["Tables"]["itinerary_items"]["Row"];
type ItemInsert = Database["public"]["Tables"]["itinerary_items"]["Insert"];
type ItemUpdate = Database["public"]["Tables"]["itinerary_items"]["Update"];

function itemsQueryKey(dayId: string) {
  return ["itinerary_items", dayId] as const;
}

export function useItineraryItems(dayId: string, initialData: ItineraryItem[]) {
  return useQuery({
    queryKey: itemsQueryKey(dayId),
    initialData,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("itinerary_items")
        .select("*")
        .eq("day_id", dayId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateItineraryItem(dayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: ItemInsert) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("itinerary_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemsQueryKey(dayId) });
    },
  });
}

export function useUpdateItineraryItem(dayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...update }: ItemUpdate & { id: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("itinerary_items")
        .update(update)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemsQueryKey(dayId) });
    },
  });
}

export function useReorderItineraryItems(dayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const supabase = createClient();
      const results = await Promise.all(
        orderedIds.map((id, index) =>
          supabase
            .from("itinerary_items")
            .update({ sort_order: index })
            .eq("id", id)
        )
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onMutate: async (orderedIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: itemsQueryKey(dayId) });
      const previous = queryClient.getQueryData<ItineraryItem[]>(
        itemsQueryKey(dayId)
      );
      if (previous) {
        const byId = new Map(previous.map((it) => [it.id, it]));
        const next = orderedIds
          .map((id, index) => {
            const it = byId.get(id);
            return it ? { ...it, sort_order: index } : null;
          })
          .filter((it): it is ItineraryItem => it !== null);
        queryClient.setQueryData(itemsQueryKey(dayId), next);
      }
      return { previous };
    },
    onError: (_err, _orderedIds, context) => {
      if (context?.previous) {
        queryClient.setQueryData(itemsQueryKey(dayId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: itemsQueryKey(dayId) });
    },
  });
}

export function useDeleteItineraryItem(dayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("itinerary_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemsQueryKey(dayId) });
    },
  });
}
