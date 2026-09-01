"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Cover photo layer: a blurred tiny placeholder underneath the real image,
 * which fades in on load. Sits inside a `relative` container; overlays
 * (gradient, tape, badges) render as siblings on top.
 */
export function CoverImage({
  src,
  blur,
  position,
  className,
}: {
  src: string;
  blur?: string | null;
  position?: string | null;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {blur && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blur}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        style={{ objectPosition: position ?? "center" }}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
