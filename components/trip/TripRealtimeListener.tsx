"use client";

import { useTripRealtime } from "@/lib/hooks/use-trip-realtime";

export function TripRealtimeListener({ tripId }: { tripId: string }) {
  useTripRealtime(tripId);
  return null;
}
