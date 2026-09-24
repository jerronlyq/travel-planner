"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { GeocodeResult } from "@/lib/mapbox/geocode";
import { searchPlacesForMode, type SearchMode } from "@/lib/geo/search";

const MIN_CHARS = 3;
const DEBOUNCE_MS = 350;

export function PlaceSearchInput({
  value,
  onChange,
  onSelect,
  placeholder,
  country,
  proximity,
  mode = "region",
  emptyHint,
  inputClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: GeocodeResult) => void;
  placeholder?: string;
  // ISO 3166-1 alpha-2 — scopes suggestions to that country.
  country?: string | null;
  // "lng,lat" — bias suggestions toward this point.
  proximity?: string | null;
  mode?: SearchMode;
  // Shown when a search finds nothing.
  emptyHint?: string;
  inputClassName?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Searches run only for text the user typed (`query`) — never for values
  // set programmatically (picking a suggestion, opening an existing item).
  useEffect(() => {
    if (query.trim().length < MIN_CHARS) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      setOpen(true);
      try {
        const found = await searchPlacesForMode(query, {
          mode,
          country,
          proximity,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setResults(found);
        setActiveIndex(-1);
        setStatus("done");
      } catch {
        if (controller.signal.aborted) return;
        setResults([]);
        setStatus("done");
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, mode, country, proximity]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleType(text: string) {
    onChange(text);
    setQuery(text);
    if (text.trim().length < MIN_CHARS) {
      setResults([]);
      setStatus("idle");
      setOpen(false);
    }
  }

  function choose(result: GeocodeResult) {
    onSelect(result);
    setQuery("");
    setResults([]);
    setStatus("idle");
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault(); // don't submit the surrounding form
      choose(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showEmpty = status === "done" && results.length === 0;
  const anyOsm = results.some((r) => r.source === "osm");

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => handleType(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0 || showEmpty) setOpen(true);
        }}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        className={cn(inputClassName)}
      />
      {status === "loading" && (
        <Loader2 className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 animate-spin" />
      )}

      {open && (
        <div
          role="listbox"
          className="bg-popover text-popover-foreground border-border absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border shadow-md"
        >
          {status === "loading" && results.length === 0 && (
            <p className="text-muted-foreground px-3 py-2.5 text-[13px]">
              Searching…
            </p>
          )}

          {showEmpty && (
            <p className="text-muted-foreground px-3 py-2.5 text-[13px] leading-[1.5]">
              {emptyHint ?? "No matches found."}
            </p>
          )}

          {results.map((result, i) => (
            <button
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              key={`${result.id}-${i}`}
              className={cn(
                "hover:bg-accent flex w-full items-start gap-2 px-3 py-2 text-left text-sm",
                i === activeIndex && "bg-accent"
              )}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => choose(result)}
            >
              <MapPin className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="truncate font-medium">{result.name}</span>
                  {result.kind && (
                    <span className="text-muted-foreground font-mono text-[9px] tracking-[0.1em] whitespace-nowrap uppercase">
                      {result.kind}
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  {result.fullAddress}
                </span>
              </span>
            </button>
          ))}

          {anyOsm && (
            <p className="text-muted-foreground border-border border-t px-3 py-1.5 text-[10px]">
              Places © OpenStreetMap contributors
            </p>
          )}
        </div>
      )}
    </div>
  );
}
