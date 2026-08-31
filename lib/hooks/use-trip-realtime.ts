"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Keeps a trip's view live across everyone invited to it. itinerary_items
// changes patch the relevant day's React Query cache directly; changes to
// days/members (which drive server-rendered parts like the day tabs and
// members list) fall back to router.refresh() rather than a full React
// Query conversion of those lists.
export function useTripRealtime(tripId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`trip:${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "itinerary_items",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const newRow = payload.new as { day_id?: string | null } | null;
          const oldRow = payload.old as { day_id?: string | null } | null;
          const dayIds = new Set(
            [newRow?.day_id, oldRow?.day_id].filter((id): id is string => !!id)
          );
          dayIds.forEach((dayId) => {
            queryClient.invalidateQueries({ queryKey: ["itinerary_items", dayId] });
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "item_attachments",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const newRow = payload.new as { item_id?: string } | null;
          const oldRow = payload.old as { item_id?: string } | null;
          const itemIds = new Set(
            [newRow?.item_id, oldRow?.item_id].filter(
              (id): id is string => !!id
            )
          );
          itemIds.forEach((itemId) => {
            queryClient.invalidateQueries({
              queryKey: ["item_attachments", itemId],
            });
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "itinerary_days",
          filter: `trip_id=eq.${tripId}`,
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_members",
          filter: `trip_id=eq.${tripId}`,
        },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, queryClient, router]);
}
