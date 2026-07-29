import * as React from "react";

import { PageContainer } from "@/components/margin/marketing/section";
import { PriceFigure } from "@/components/margin/price-figure";
import { cn } from "@/lib/utils";

/**
 * The top of a marketing page: one claim, one paragraph, one or two actions.
 *
 * Udemy's hero is a rotating carousel of promotional panels, each one a
 * different offer with a deadline on it. That mechanism is inseparable from
 * the thing it sells — a single purchase that has to be closed today — and
 * ADR-0001 removes the purchase, which removes the deadline, which removes the
 * carousel. What is left is the part that was doing the honest work: say what
 * this is, in one sentence, above the fold.
 *
 * The figure is decorative and sits *behind* the copy rather than beside it,
 * washed out by a gradient. Same reasoning as the auth panel: at full strength
 * the stroke is the loudest thing on the screen and crosses the headline at
 * whatever height the viewport happens to give it, so the copy's contrast
 * moves with the window.
 *
 * `note` is where the risk disclaimer goes on a page that sells a
 * financial-education product. It renders small and quiet, but above the fold
 * rather than only in the footer.
 */
function Hero({
  eyebrow,
  title,
  description,
  actions,
  note,
  aside,
  className,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Small print under the actions — the risk disclaimer, typically. */
  note?: React.ReactNode;
  /** Optional second column: a card, a stat panel, a preview. */
  aside?: React.ReactNode;
}) {
  return (
    <section
      data-slot="hero"
      className={cn("relative overflow-hidden bg-subtle/60", className)}
      {...props}
    >
      <PriceFigure
        id="hero-figure"
        className="absolute inset-0 size-full opacity-40"
      />
      {/*
       * Opaque where the copy sits, clearing upward, so the figure reads as
       * ground rather than as something the headline is printed on.
       */}
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-background from-15% via-background/85 via-60% to-transparent"
      />

      <PageContainer className="relative py-16 sm:py-24">
        <div
          className={cn(
            "grid items-center gap-10",
            aside ? "lg:grid-cols-[1.15fr_0.85fr]" : null
          )}
        >
          <div className="flex flex-col items-start gap-6">
            {eyebrow ? (
              <span className="rounded-4xl bg-primary-muted px-2.5 py-1 text-xs font-medium text-primary-text">
                {eyebrow}
              </span>
            ) : null}

            <div className="flex flex-col gap-4">
              <h1 className="measure-narrow font-heading text-display-lg font-bold text-balance text-foreground">
                {title}
              </h1>
              {description ? (
                <p className="measure-prose text-prose-lg text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>

            {actions ? (
              <div className="flex flex-wrap items-center gap-3">{actions}</div>
            ) : null}

            {note ? (
              <p className="measure-prose text-xs text-muted-foreground">
                {note}
              </p>
            ) : null}
          </div>

          {aside ? <div className="lg:justify-self-end">{aside}</div> : null}
        </div>
      </PageContainer>
    </section>
  );
}

export { Hero };
