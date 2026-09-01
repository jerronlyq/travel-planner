"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceSearchInput } from "@/components/map/PlaceSearchInput";

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
    <div className="mx-auto w-full max-w-xl flex-1 p-6">
      <Card>
        <CardHeader>
          <CardTitle>New trip</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Trip name</Label>
              <Input
                id="name"
                required
                placeholder="Japan 2027"
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
              {countryCode && (
                <p className="text-muted-foreground text-xs">
                  Item location search will be limited to{" "}
                  <span className="text-foreground font-medium">
                    {countryName ?? countryCode}
                  </span>
                  .
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create trip"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
