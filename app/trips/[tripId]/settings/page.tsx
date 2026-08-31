import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TripSettingsForm } from "@/components/trip/TripSettingsForm";
import { DeleteTripSection } from "@/components/trip/DeleteTripSection";

export default async function TripSettingsPage({
  params,
}: PageProps<"/trips/[tripId]/settings">) {
  const { tripId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();

  if (!trip) notFound();

  const { data: membership } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.role !== "owner") redirect(`/trips/${tripId}/overview`);

  return (
    <div className="mx-auto w-full max-w-xl space-y-10 p-6">
      <TripSettingsForm
        trip={{
          id: trip.id,
          name: trip.name,
          destination: trip.destination,
          description: trip.description,
          start_date: trip.start_date,
          end_date: trip.end_date,
          timezone: trip.timezone,
          country_code: trip.country_code,
          default_currency: trip.default_currency,
        }}
      />
      <DeleteTripSection tripId={trip.id} tripName={trip.name} />
    </div>
  );
}
