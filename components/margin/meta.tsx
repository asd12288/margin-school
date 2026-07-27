import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The small labels that describe a piece of content: duration, lesson count,
 * concepts, free preview.
 *
 * Deliberately absent: levels, XP, points, streaks, achievement badges. The
 * mechanics of a good learning product are welcome — progress, review,
 * resume — but the scoring furniture of a game is not. The brief asks for
 * "encouraging, not congratulatory", and an adult learning about money is not
 * levelling up.
 *
 * None of these components contain copy. Every visible string arrives as a
 * prop, because AGENTS.md rule 7 requires every user-facing string to be
 * translatable and these components ship before next-intl does.
 */

/* -------------------------------------------------------------------------
   Inline metadata
   ------------------------------------------------------------------------- */

/** An icon and a value, for durations and counts. Sits in a card footer or a
 *  lesson header. */
function MetaStat({
  icon: Icon,
  children,
  className,
  ...props
}: React.ComponentProps<"span"> & {
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span
      data-slot="meta-stat"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className
      )}
      {...props}
    >
      {Icon ? <Icon className="size-3.5 shrink-0" /> : null}
      {children}
    </span>
  );
}

/** A row of MetaStat separated by hairline dots. */
function MetaRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="meta-row"
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1",
        "[&>[data-slot=meta-stat]+[data-slot=meta-stat]]:before:mr-3",
        "[&>[data-slot=meta-stat]+[data-slot=meta-stat]]:before:content-['·']",
        "[&>[data-slot=meta-stat]+[data-slot=meta-stat]]:before:text-border-strong",
        className
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------
   Concepts
   ------------------------------------------------------------------------- */

/**
 * A concept from the skill graph. Mastery attaches to these, never to
 * lessons — see ADR-0004. Showing them beside a lesson is what makes that
 * separation legible to the learner rather than only true in the schema.
 *
 * Squared rather than a pill, and carrying a status indicator rather than
 * relying on a colour wash: a rounded pill in a tinted fill is the most
 * generic object in interface design, and these appear in clusters where
 * "which of these do I already know" has to be answerable at a glance.
 *
 * The indicator does that work — a hollow ring becomes a filled check — so
 * the state survives greyscale and colour blindness instead of living only in
 * the background tint. `known` stays a quiet change: no burst, no counter.
 */
function ConceptChip({
  className,
  known = false,
  children,
  ...props
}: React.ComponentProps<"span"> & { known?: boolean }) {
  return (
    <span
      data-slot="concept-chip"
      data-known={known}
      className={cn(
        "group/chip inline-flex items-center gap-2 rounded-md border py-1 pr-2.5 pl-2",
        "text-xs font-medium shadow-card",
        "transition-[border-color,background-color,box-shadow] duration-fast ease-quiet",
        known
          ? "border-success/30 bg-success-muted text-success"
          : "border-border bg-card text-subtle-foreground hover:border-border-strong",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-3.5 items-center justify-center rounded-4xl border transition-colors duration-base ease-quiet",
          known
            ? "border-transparent bg-success text-success-foreground"
            : "border-border-strong"
        )}
      >
        {known ? <Check className="size-2.5" strokeWidth={3.5} /> : null}
      </span>
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Free preview
   ------------------------------------------------------------------------- */

/**
 * `is_free_preview` is the only free/paid switch in the content model, so it
 * gets exactly one visual treatment everywhere it appears.
 */
function FreePreviewBadge({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="free-preview-badge"
      className={cn(
        "inline-flex items-center rounded-4xl bg-free-preview px-2 py-0.5",
        "text-xs font-medium text-free-preview-foreground",
        className
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------
   Market figures
   ------------------------------------------------------------------------- */

const marketChangeVariants = cva("inline-flex items-baseline gap-1 numeric", {
  variants: {
    direction: {
      up: "text-gain",
      down: "text-loss",
      flat: "text-flat",
    },
  },
  defaultVariants: { direction: "flat" },
});

/**
 * A price and its change.
 *
 * The glyph carries the same information as the colour, so direction survives
 * colour blindness and greyscale — roughly one man in twelve cannot separate
 * the emerald from the rose, and a percentage that only means something in
 * colour means nothing to them.
 */
function MarketFigure({
  value,
  change,
  direction = "flat",
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof marketChangeVariants> & {
    value: string;
    change?: string;
  }) {
  const glyph = direction === "up" ? "▲" : direction === "down" ? "▼" : "—";

  return (
    <span
      data-slot="market-figure"
      className={cn("inline-flex items-baseline gap-2", className)}
      {...props}
    >
      <span className="numeric font-mono text-sm text-foreground">{value}</span>
      {change ? (
        <span className={marketChangeVariants({ direction })}>
          <span aria-hidden className="text-[0.7em]">
            {glyph}
          </span>
          <span className="numeric font-mono text-xs">{change}</span>
        </span>
      ) : null}
    </span>
  );
}

export {
  ConceptChip,
  FreePreviewBadge,
  MarketFigure,
  MetaRow,
  MetaStat,
  marketChangeVariants,
};
