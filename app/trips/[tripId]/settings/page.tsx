import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TripSettingsForm } from "@/components/trip/TripSettingsForm";
import { CoverImageField } from "@/components/trip/CoverImageField";
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

  const { data: coverSigned } = trip.cover_photo_path
    ? await supabase.storage
        .from("trip-photos")
        .createSignedUrl(trip.cover_photo_path, 3600)
    : { data: null };

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-7 md:px-8">
      <div className="border-border border-b pb-3.5">
        <p className="eyebrow">{trip.name}</p>
        <h1 className="font-heading mt-0.5 text-[32px] leading-[1.1] font-medium tracking-[-0.02em]">
          The details
        </h1>
      </div>

      <div className="border-border/70 mt-6 grid gap-x-4 gap-y-2 border-y py-4 sm:grid-cols-[128px_1fr]">
        <span className="font-mono text-muted-foreground pt-1.5 text-[10px] tracking-[0.14em] uppercase">
          Cover photo
        </span>
        <CoverImageField
          tripId={trip.id}
          currentPath={trip.cover_photo_path}
          currentUrl={coverSigned?.signedUrl ?? null}
        />
      </div>

      <div className="mt-2">
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
      </div>

      <div className="border-border/70 mt-10 border-t pt-6">
        <DeleteTripSection tripId={trip.id} tripName={trip.name} />
      </div>
    </div>
  );
}
