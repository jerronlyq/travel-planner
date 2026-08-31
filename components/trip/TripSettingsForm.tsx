"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { syncItineraryDays } from "@/lib/utils/itinerary-days";
import { CURRENCIES } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Trip settings</h2>

      <div className="space-y-2">
        <Label htmlFor="name">Trip name</Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="destination">Destination</Label>
        <PlaceSearchInput
          value={destination}
          placeholder="Search for a city or country..."
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
        {countryCode ? (
          <p className="text-muted-foreground text-xs">
            Place search for items is limited to{" "}
            <span className="text-foreground font-medium">
              {countryName ?? countryCode}
            </span>
            . Clear the field to search worldwide.
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Pick a result from the list to limit item location search to that
            country.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start date</Label>
          <Input
            id="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">End date</Label>
          <Input
            id="end_date"
            type="date"
            min={startDate || undefined}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Extending the dates adds the new days. Shortening the range leaves
        existing days in place so nothing already planned is lost.
      </p>

      <div className="space-y-2">
        <Label htmlFor="timezone">Time zone</Label>
        <Input
          id="timezone"
          list={tzListId}
          placeholder="e.g. Asia/Tokyo"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        />
        <datalist id={tzListId}>
          {TIME_ZONES.map((tz) => (
            <option key={tz} value={tz} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Default currency</Label>
        <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
          <SelectTrigger id="currency" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((code) => (
              <SelectItem key={code} value={code}>
                {code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
