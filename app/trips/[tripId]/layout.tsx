import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TripTabs } from "@/components/trip/TripTabs";
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

  const [{ data: days }, { data: membership }] = await Promise.all([
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

  return (
    <TripRoleProvider role={membership?.role ?? null}>
      <TripRealtimeListener tripId={tripId} />
      <div className="flex flex-1 flex-col">
        <header className="px-6 pt-6">
          <h1 className="text-xl font-semibold">{trip.name}</h1>
        </header>
        <TripTabs tripId={tripId} days={days ?? []} />
        <div className="flex-1">{children}</div>
      </div>
    </TripRoleProvider>
  );
}
