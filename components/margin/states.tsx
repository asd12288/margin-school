import * as React from "react";
import { Languages, Lock, RotateCcw, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The five states every data-driven surface ships with, per
 * docs/ux-architecture.md. Loading lives in `skeletons.tsx`; the other four
 * are here.
 *
 * These are the components that actually differentiate the product, and the
 * ones most often left as an afterthought. `Locked` in particular is shown
 * constantly in a subscription product — it is a designed destination, never
 * a redirect and never a disabled button.
 *
 * All copy arrives as props. These components own layout, tone and motion;
 * the words belong to next-intl.
 */

/* -------------------------------------------------------------------------
   Shared frame
   ------------------------------------------------------------------------- */

function StateFrame({
  icon: Icon,
  tone = "neutral",
  title,
  description,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  icon?: LucideIcon;
  tone?: "neutral" | "locked" | "error" | "info";
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  // The tone is carried by the icon and the border, not by flooding the
  // surface. A full panel of red or blue is the loudest thing on a page, and
  // the brief asks the interface to lower the heart rate — an error should be
  // legible, not alarming. The muted status colours still get used, but as a
  // tint behind the icon rather than across the whole state.
  const toneStyles = {
    neutral: "border-border bg-muted/40",
    locked: "border-locked-border bg-locked",
    error: "border-destructive/25 bg-muted/40",
    info: "border-info/25 bg-muted/40",
  }[tone];

  const iconStyles = {
    neutral: "border-border bg-background text-muted-foreground",
    locked: "border-border bg-background text-locked-foreground",
    error: "border-destructive/20 bg-destructive-muted text-destructive",
    info: "border-info/20 bg-info-muted text-info",
  }[tone];

  return (
    <div
      data-slot="state"
      data-tone={tone}
      className={cn(
        "flex flex-col items-center rounded-xl border px-6 py-10 text-center",
        "animate-panel-reveal",
        toneStyles,
        className
      )}
      {...props}
    >
      {Icon ? (
        <div
          className={cn(
            "mb-4 flex size-10 items-center justify-center rounded-4xl border",
            iconStyles
          )}
        >
          <Icon className="size-4.5" />
        </div>
      ) : null}
      <p className="font-heading text-base font-semibold text-foreground">
        {title}
      </p>
      {description ? (
        <p className="measure-narrow mt-1.5 text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Empty
   ------------------------------------------------------------------------- */

/**
 * First-run especially: a new subscriber's dashboard is empty, and it is
 * their first impression. It should read as an invitation, not a shrug.
 */
function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <StateFrame
      icon={icon}
      tone="neutral"
      title={title}
      description={description}
      className={className}
      {...props}
    >
      {action}
    </StateFrame>
  );
}

/* -------------------------------------------------------------------------
   Error
   ------------------------------------------------------------------------- */

/** Recoverable, with a retry. Never a bare stack trace. */
function ErrorState({
  title,
  description,
  retryLabel,
  onRetry,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <StateFrame
      icon={RotateCcw}
      tone="error"
      title={title}
      description={description}
      className={className}
      {...props}
    >
      {onRetry && retryLabel ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw data-icon="inline-start" />
          {retryLabel}
        </Button>
      ) : null}
    </StateFrame>
  );
}

/* -------------------------------------------------------------------------
   Locked
   ------------------------------------------------------------------------- */

/**
 * "This is included, subscribe to continue."
 *
 * Two rules hold this together. It never shows a price, a discount or a
 * timer — access is one all-access subscription and ADR-0001 forbids
 * per-course commerce. And it argues from depth: what is behind this, how
 * much of it there is. `included` is that argument, rendered as plain facts.
 *
 * Whether it renders at all is decided by `canAccess`, never by an inline
 * subscription check — see ADR-0006.
 */
function LockedState({
  title,
  description,
  included,
  action,
  secondaryAction,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** What the subscription contains. Facts, not persuasion. */
  included?: React.ReactNode[];
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}) {
  return (
    <StateFrame
      icon={Lock}
      tone="locked"
      title={title}
      description={description}
      className={className}
      {...props}
    >
      <div className="flex flex-col items-center gap-5">
        {included?.length ? (
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
            {included.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-1.5 text-xs text-locked-foreground"
              >
                <span aria-hidden className="size-1 rounded-4xl bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      </div>
    </StateFrame>
  );
}

/**
 * The inline variant: a locked lesson row inside a curriculum, or a locked
 * card in a grid. Same tokens, no ceremony.
 */
function LockedHint({
  label,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & { label: string }) {
  return (
    <span
      data-slot="locked-hint"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-4xl border border-locked-border",
        "bg-locked px-2 py-0.5 text-xs text-locked-foreground",
        className
      )}
      {...props}
    >
      <Lock className="size-3" />
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Unavailable in this language
   ------------------------------------------------------------------------- */

/**
 * A product state, not an error — see docs/content-model.md rule 6. Publish
 * status is per locale, so a lesson published in French and still draft in
 * English is routine. The catalog degrades gracefully: show the thing, say
 * it is not ready here, offer the locale where it is.
 */
function UnavailableInLocaleState({
  title,
  description,
  action,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** A link to the locale where this content is published. */
  action?: React.ReactNode;
}) {
  return (
    <StateFrame
      icon={Languages}
      tone="info"
      title={title}
      description={description}
      className={className}
      {...props}
    >
      {action}
    </StateFrame>
  );
}

/** Inline variant, for a lesson row in a curriculum accordion. */
function UnavailableInLocaleHint({
  label,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & { label: string }) {
  return (
    <span
      data-slot="unavailable-locale-hint"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-4xl border border-info/20",
        "bg-info-muted px-2 py-0.5 text-xs text-info-muted-foreground",
        className
      )}
      {...props}
    >
      <Languages className="size-3" />
      {label}
    </span>
  );
}

export {
  EmptyState,
  ErrorState,
  LockedHint,
  LockedState,
  StateFrame,
  UnavailableInLocaleHint,
  UnavailableInLocaleState,
};
