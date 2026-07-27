import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * A course cover.
 *
 * When the content team has produced artwork, this renders it. Until then it
 * draws a deterministic abstract figure from the course id: a two-stop
 * gradient off the chart palette plus a line that behaves like a price
 * series.
 *
 * Generated rather than stock photography on purpose. AGENTS.md rule 1 says
 * placeholder content must be obviously placeholder — a stock photo of a
 * trading desk reads as real editorial and quietly becomes permanent, while
 * an abstract figure never will. It also means a 40-course catalog looks
 * finished on the day it ships, with no art budget spent before anyone has
 * read a lesson.
 *
 * Deterministic matters: the same course keeps the same cover across renders
 * and reloads, so people navigate by it.
 */

/** FNV-1a. Small, stable, and no dependency. */
function hash(input: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h);
}

/** A rising-then-settling path, varied by seed. Not real market data — it is
 *  ornament, and pretending otherwise would be its own kind of lie. */
function seriesPath(seed: number) {
  const points = 9;
  let d = "";
  for (let i = 0; i < points; i += 1) {
    const x = (i / (points - 1)) * 100;
    // Deterministic pseudo-noise around a gentle upward drift.
    const noise = ((seed >> (i * 2)) & 0x0f) / 15;
    const drift = 1 - i / (points - 1);
    const y = 18 + drift * 34 + noise * 22;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return d.trim();
}

function CourseCover({
  courseId,
  src,
  alt,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  courseId: string;
  src?: string | null;
  /** Required when `src` is set. The generated cover is decorative and is
   *  hidden from assistive technology instead. */
  alt?: string;
}) {
  if (src) {
    return (
      <div
        data-slot="course-cover"
        className={cn("relative overflow-hidden bg-muted", className)}
        {...props}
      >
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          sizes="(max-width: 640px) 100vw, 22rem"
          className="object-cover transition-transform duration-slow ease-quiet group-hover/card:scale-[1.03]"
        />
      </div>
    );
  }

  const seed = hash(courseId);

  // Every cover is mixed from the same three cool chart hues — indigo, cyan,
  // emerald — and varies only in mix ratio and angle. Drawing freely from the
  // full palette instead would put an amber cover next to a rose one and make
  // a catalog page look like a swatch book; this way the grid reads as one
  // wall while each course still keeps a cover you can navigate by.
  const angle = 120 + (seed % 5) * 15;
  const mixFrom = (seed % 4) * 22;
  const mixTo = ((seed >> 4) % 4) * 22;

  return (
    <div
      data-slot="course-cover"
      aria-hidden
      className={cn("relative overflow-hidden bg-muted", className)}
      style={{
        backgroundImage: `linear-gradient(${angle}deg, color-mix(in oklch, var(--chart-1), var(--chart-2) ${mixFrom}%) 0%, color-mix(in oklch, var(--chart-2), var(--chart-3) ${mixTo}%) 100%)`,
      }}
      {...props}
    >
      <svg
        viewBox="0 0 100 64"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full transition-transform duration-slow ease-quiet group-hover/card:scale-[1.03]"
      >
        <defs>
          <linearGradient id={`fade-${courseId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--highlight)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d={`${seriesPath(seed)} L100,64 L0,64 Z`}
          fill={`url(#fade-${courseId})`}
        />
        <path
          d={seriesPath(seed)}
          fill="none"
          stroke="var(--highlight)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export { CourseCover };
