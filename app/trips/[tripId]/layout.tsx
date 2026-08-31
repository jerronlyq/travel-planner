import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TripHeader } from "@/components/trip/TripHeader";
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

  const [{ data: daysData }, { data: membership }] = await Promise.all([
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
  ]);

  const days = daysData ?? [];
  const role = membership?.role ?? null;

  return (
    <TripRoleProvider role={role}>
      <TripRealtimeListener tripId={tripId} />
      <div className="flex flex-1 flex-col">
        <TripHeader
          tripId={tripId}
          name={trip.name}
          destination={trip.destination}
          startDate={trip.start_date}
          endDate={trip.end_date}
          isOwner={role === "owner"}
        />
        <TripNav tripId={tripId} firstDayId={days[0]?.id ?? null} />
        <DayRail tripId={tripId} days={days} />
        <div className="flex-1 pb-20 md:pb-0">{children}</div>
      </div>
    </TripRoleProvider>
  );
}
