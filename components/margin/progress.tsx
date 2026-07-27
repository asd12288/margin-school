import * as React from "react";

import { cn } from "@/lib/utils";
import { isComplete, toPercent } from "@/lib/progress";

/**
 * Progress, at three scales.
 *
 * The brief asks for a visual language that repeats at several scales without
 * becoming noise, so all three of these are the same idea drawn three ways:
 * a track that fills, in `--progress-indicator`, turning
 * `--progress-complete` only when the whole thing is done. No points, no
 * streaks, no celebration — completion is marked, not applauded.
 *
 * Every one of them takes its accessible label as a prop. None contain copy.
 */

/* -------------------------------------------------------------------------
   Bar — lesson and chapter scale
   ------------------------------------------------------------------------- */

function ProgressBar({
  completed,
  total,
  label,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  completed: number;
  total: number;
  /** Accessible name, e.g. "11 of 18 lessons complete". */
  label: string;
}) {
  const value = toPercent(completed, total);
  const done = isComplete(completed, total);

  return (
    <div
      data-slot="progress-bar"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "h-1 w-full overflow-hidden rounded-4xl bg-progress-track",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-4xl transition-[width,background-color] duration-slow ease-quiet",
          done ? "bg-progress-complete" : "bg-progress-indicator"
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------
   Ring — course scale, for cards
   ------------------------------------------------------------------------- */

function ProgressRing({
  completed,
  total,
  label,
  size = 36,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  completed: number;
  total: number;
  label: string;
  size?: number;
}) {
  const value = toPercent(completed, total);
  const done = isComplete(completed, total);
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      data-slot="progress-ring"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-progress-track"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (value / 100) * circumference}
          className={cn(
            "transition-[stroke-dashoffset,stroke] duration-slow ease-quiet",
            done ? "stroke-progress-complete" : "stroke-progress-indicator"
          )}
        />
      </svg>
      <span
        aria-hidden
        data-numeric
        className={cn(
          "absolute inset-0 flex items-center justify-center text-3xs font-medium",
          done ? "text-progress-complete" : "text-muted-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Rail — position within a chapter, for the study shell
   ------------------------------------------------------------------------- */

/**
 * Where you are in the current chapter, lesson by lesson. A beginner's core
 * fear is being lost; this answers "how much is left" without a number.
 */
function ProgressRail({
  lessons,
  label,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  lessons: { id: string; completed: boolean; current?: boolean }[];
  label: string;
}) {
  return (
    <div
      data-slot="progress-rail"
      // `aria-label` is prohibited on a element with no role — a bare div is
      // `generic`, and a name on it is dropped by some screen readers and
      // flagged by axe. `role="img"` is the honest description: a single
      // graphic summarising position, whose meaning is entirely in the label.
      role="img"
      aria-label={label}
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      {lessons.map((lesson) => (
        <span
          key={lesson.id}
          data-current={lesson.current}
          className={cn(
            "h-1 flex-1 rounded-4xl transition-colors duration-base ease-quiet",
            lesson.completed
              ? "bg-progress-complete"
              : lesson.current
                ? "bg-progress-indicator"
                : "bg-progress-track"
          )}
        />
      ))}
    </div>
  );
}

export { ProgressBar, ProgressRail, ProgressRing };
