"use client";

import { createContext, useContext } from "react";
import type { TripRole } from "@/lib/types/database.types";

// The real security boundary is RLS — this only drives UI (hide buttons a
// viewer can't use, etc.), so it's fine if it's ever momentarily stale.
const TripRoleContext = createContext<TripRole | null>(null);

export function TripRoleProvider({
  role,
  children,
}: {
  role: TripRole | null;
  children: React.ReactNode;
}) {
  return (
    <TripRoleContext.Provider value={role}>{children}</TripRoleContext.Provider>
  );
}

export function useTripRole() {
  return useContext(TripRoleContext);
}

export function useCanEdit() {
  const role = useTripRole();
  return role === "owner" || role === "editor";
}
