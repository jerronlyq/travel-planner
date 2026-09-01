"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchPlaces, type GeocodeResult } from "@/lib/mapbox/geocode";

export function PlaceSearchInput({
  value,
  onChange,
  onSelect,
  placeholder,
  country,
  inputClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: GeocodeResult) => void;
  placeholder?: string;
  // ISO 3166-1 alpha-2 — restricts suggestions to that country.
  country?: string | null;
  inputClassName?: string;
}) {
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!value.trim()) {
        setResults([]);
        setOpen(false);
        return;
      }
      const found = await searchPlaces(value, { country });
      setResults(found);
      setOpen(found.length > 0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [value, country]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        autoComplete="off"
        className={cn(inputClassName)}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
          {results.map((result) => (
            <button
              type="button"
              key={result.id}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => {
                onSelect(result);
                setOpen(false);
              }}
            >
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span>
                <span className="block font-medium">{result.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {result.fullAddress}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
