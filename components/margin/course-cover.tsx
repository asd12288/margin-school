import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { coverGradient, coverSeriesPath } from "@/lib/cover";

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

  const { angle, mixFrom, mixTo } = coverGradient(courseId);

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
          d={`${coverSeriesPath(courseId)} L100,64 L0,64 Z`}
          fill={`url(#fade-${courseId})`}
        />
        <path
          d={coverSeriesPath(courseId)}
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
