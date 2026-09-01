"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { syncItineraryDays } from "@/lib/utils/itinerary-days";
import { CURRENCIES } from "@/lib/utils/currency";
import { PlaceSearchInput } from "@/components/map/PlaceSearchInput";

type TripSettings = {
  id: string;
  name: string;
  destination: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  timezone: string | null;
  country_code: string | null;
  default_currency: string;
};

const TIME_ZONES: string[] =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : [];

const UNDERLINE =
  "h-[36px] w-full rounded-none border-0 border-b-[1.5px] border-border bg-transparent px-0 text-[15px] outline-none transition-colors focus:border-brand focus-visible:border-brand focus-visible:ring-0";

function Row({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="border-border/70 grid gap-x-4 gap-y-1.5 border-b py-4 sm:grid-cols-[128px_1fr]">
      <span className="font-mono text-muted-foreground pt-1.5 text-[10px] tracking-[0.14em] uppercase">
        {label}
      </span>
      <div className="flex flex-col gap-1.5">
        {children}
        {hint && <p className="text-muted-foreground text-[12px]">{hint}</p>}
      </div>
    </div>
  );
}

export function TripSettingsForm({ trip }: { trip: TripSettings }) {
  const router = useRouter();
  const tzListId = useId();

  const [name, setName] = useState(trip.name);
  const [destination, setDestination] = useState(trip.destination ?? "");
  const [countryCode, setCountryCode] = useState<string | null>(
    trip.country_code
  );
  const [countryName, setCountryName] = useState<string | null>(null);
  const [description, setDescription] = useState(trip.description ?? "");
  const [startDate, setStartDate] = useState(trip.start_date ?? "");
  const [endDate, setEndDate] = useState(trip.end_date ?? "");
  const [timezone, setTimezone] = useState(trip.timezone ?? "");
  const [currency, setCurrency] = useState(trip.default_currency);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (startDate && endDate && endDate < startDate) {
      setError("End date can't be before the start date.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("trips")
      .update({
        name,
        destination: destination || null,
        country_code: destination ? countryCode : null,
        description: description || null,
        start_date: startDate || null,
        end_date: endDate || null,
        timezone: timezone || null,
        default_currency: currency,
      })
      .eq("id", trip.id);

    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }

    const datesChanged =
      startDate !== (trip.start_date ?? "") || endDate !== (trip.end_date ?? "");
    if (datesChanged) {
      await syncItineraryDays(
        supabase,
        trip.id,
        startDate || null,
        endDate || null
      );
    }

    setSaving(false);
    toast.success("Trip updated");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="border-border/70 border-t">
        <Row label="Trip name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${UNDERLINE} font-heading text-[18px]`}
          />
        </Row>

        <Row
          label="Destination"
          hint={
            countryCode
              ? `Item place search is limited to ${countryName ?? countryCode}. Clear the field to search worldwide.`
              : "Pick a result from the list to limit item place search to that country."
          }
        >
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
        </Row>

        <Row
          label="Dates"
          hint="Extending the range adds days. Shortening it leaves existing days in place so nothing planned is lost."
        >
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`${UNDERLINE} font-mono text-[13px]`}
            />
            <span className="text-muted-foreground text-[13px]">to</span>
            <input
              type="date"
              min={startDate || undefined}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`${UNDERLINE} font-mono text-[13px]`}
            />
          </div>
        </Row>

        <Row label="Time zone">
          <input
            list={tzListId}
            placeholder="e.g. Asia/Tokyo"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={`${UNDERLINE} font-mono text-[13px]`}
          />
          <datalist id={tzListId}>
            {TIME_ZONES.map((tz) => (
              <option key={tz} value={tz} />
            ))}
          </datalist>
        </Row>

        <Row label="Currency">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={`${UNDERLINE} appearance-none font-mono text-[13px]`}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Description">
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border-border focus:border-brand w-full resize-none border-b-[1.5px] bg-transparent py-1 text-[15px] leading-[1.55] outline-none"
          />
        </Row>
      </div>

      {error && <p className="text-destructive mt-4 text-[13px]">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-primary text-primary-foreground press mt-5 inline-flex h-10 items-center rounded-full px-5 text-[13.5px] font-semibold tracking-[0.02em] disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
