import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TripSidebar } from "@/components/trip/TripSidebar";
import { TripNav } from "@/components/trip/TripNav";
import { DayRail } from "@/components/trip/DayRail";
import { TripRoleProvider } from "@/components/trip/TripRoleContext";
import { TripRealtimeListener } from "@/components/trip/TripRealtimeListener";

export default async function TripLayout({
  children,
  params,
}: LayoutProps<"/trips/[tripId]">) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();

  if (!trip) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: daysData }, { data: membership }, { data: memberRows }] =
    await Promise.all([
      supabase
        .from("itinerary_days")
        .select("id, date")
        .eq("trip_id", tripId)
        .order("date", { ascending: true }),
      user
        ? supabase
            .from("trip_members")
            .select("role")
            .eq("trip_id", tripId)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("trip_members").select("user_id").eq("trip_id", tripId),
    ]);

  const days = daysData ?? [];
  const role = membership?.role ?? null;

  const memberIds = (memberRows ?? []).map((m) => m.user_id);
  const { data: profileRows } = memberIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, email")
        .in("id", memberIds)
    : { data: [] };
  const memberInitials = (profileRows ?? []).map((p) =>
    (p.display_name || p.email || "?").charAt(0).toUpperCase()
  );

  return (
    <TripRoleProvider role={role}>
      <TripRealtimeListener tripId={tripId} />
      <div className="flex flex-1 md:grid md:grid-cols-[232px_1fr]">
        <TripSidebar
          tripId={tripId}
          tripName={trip.name}
          days={days}
          firstDayId={days[0]?.id ?? null}
          memberInitials={memberInitials}
          isOwner={role === "owner"}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <DayRail tripId={tripId} days={days} />
          <div className="flex-1 pb-16 md:pb-0">{children}</div>
        </div>
        <TripNav tripId={tripId} firstDayId={days[0]?.id ?? null} />
      </div>
    </TripRoleProvider>
  );
}
