import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The argument from depth, as four numbers.
 *
 * Udemy's equivalent row counts *people* — students enrolled, companies
 * trusting it, instructors teaching. Every one of those is social proof and
 * every one is forbidden here (ADR-0002), so this counts the catalog instead:
 * how many courses, how many lessons, how many hours, how many languages.
 * Those are facts about the thing being sold rather than about its crowd,
 * which is the only honest lever a sole publisher has.
 *
 * **These must be derived, never authored.** A hand-written "40 courses" is a
 * claim that goes stale the moment the catalog changes, and a stale count on a
 * marketing page is indistinguishable from a false one. Callers pass values
 * computed from the catalog itself.
 *
 * Every figure is `data-numeric` — tabular figures, so a row of them aligns
 * and does not jitter if it ever animates.
 */
function Stat({
  value,
  label,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  value: React.ReactNode;
  label: React.ReactNode;
}) {
  return (
    <div
      data-slot="stat"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      <span
        data-numeric
        className="font-heading text-display-sm font-bold text-foreground"
      >
        {value}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * A `<dl>` would be the tempting markup here and is wrong: these are not
 * term/definition pairs, they are labelled values, and the label is below the
 * value. A plain grid of `Stat` keeps the reading order the visual order.
 */
function StatBand({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-band"
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-8 rounded-xl border border-border bg-card px-6 py-7 shadow-card sm:grid-cols-4",
        className
      )}
      {...props}
    />
  );
}

export { Stat, StatBand };
