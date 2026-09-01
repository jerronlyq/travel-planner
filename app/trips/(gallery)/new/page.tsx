"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { syncItineraryDays } from "@/lib/utils/itinerary-days";
import { CURRENCIES } from "@/lib/utils/currency";
import { UnderlineField } from "@/components/ui/underline-field";
import { PlaceSearchInput } from "@/components/map/PlaceSearchInput";

const UNDERLINE =
  "h-[38px] rounded-none border-0 border-b-[1.5px] border-border bg-transparent px-0 text-[15px] focus-visible:border-brand focus-visible:ring-0";

export default function NewTripPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [countryName, setCountryName] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayCount =
    startDate && endDate && endDate >= startDate
      ? differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError("You must be signed in.");
      return;
    }

    const { data: trip, error: insertError } = await supabase
      .from("trips")
      .insert({
        owner_id: user.id,
        name,
        destination: destination || null,
        country_code: destination ? countryCode : null,
        description: description || null,
        start_date: startDate || null,
        end_date: endDate || null,
        default_currency: currency,
      })
      .select()
      .single();

    if (insertError || !trip) {
      setLoading(false);
      setError(insertError?.message ?? "Failed to create trip.");
      return;
    }

    await syncItineraryDays(supabase, trip.id, trip.start_date, trip.end_date);

    toast.success("Trip created");
    router.push(`/trips/${trip.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-6 py-9 sm:px-8">
      <p className="eyebrow text-brand">New trip</p>
      <h1 className="font-heading mt-1 text-[38px] leading-[1.05] font-medium tracking-[-0.02em]">
        Give it a name and a rough shape
      </h1>
      <p className="text-muted-foreground mt-2 text-[13.5px] leading-[1.55]">
        Dates are optional — set them and the days lay themselves out.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <UnderlineField
          label="Trip name"
          required
          placeholder="Japan 2027"
          className="font-heading text-[21px]"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex flex-col gap-1">
          <span className="font-mono text-muted-foreground text-[10px] tracking-[0.14em] uppercase">
            Destination
          </span>
          <PlaceSearchInput
            value={destination}
            placeholder="Search for a city or country…"
            inputClassName={UNDERLINE}
            onChange={(v) => {
              setDestination(v);
              if (!v) {
                setCountryCode(null);
                setCountryName(null);
              }
            }}
            onSelect={(result) => {
              setDestination(result.fullAddress || result.name);
              setCountryCode(result.countryCode);
              setCountryName(result.countryName);
            }}
          />
          {countryCode && (
            <p className="text-muted-foreground text-[12px]">
              Item location search will be limited to{" "}
              <span className="text-foreground font-medium">
                {countryName ?? countryCode}
              </span>
              .
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-5">
          <UnderlineField
            label="Start date"
            type="date"
            className="font-mono text-[14px]"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <UnderlineField
            label="End date"
            type="date"
            min={startDate || undefined}
            className="font-mono text-[14px]"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="currency"
            className="font-mono text-muted-foreground text-[10px] tracking-[0.14em] uppercase"
          >
            Default currency
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="border-border focus:border-brand h-[38px] w-full appearance-none border-b-[1.5px] bg-transparent font-mono text-[14px] outline-none"
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="description"
            className="font-mono text-muted-foreground text-[10px] tracking-[0.14em] uppercase"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border-border focus:border-brand w-full resize-none border-b-[1.5px] bg-transparent py-1 text-[15px] leading-[1.55] outline-none"
          />
        </div>

        {error && <p className="text-destructive text-[13px]">{error}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground press inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-[14px] font-semibold tracking-[0.02em] disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create the trip →"}
          </button>
          {dayCount > 0 && (
            <span className="font-mono text-muted-foreground text-[10px] tracking-[0.14em] uppercase">
              {dayCount} {dayCount === 1 ? "day" : "days"} will be laid out
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
