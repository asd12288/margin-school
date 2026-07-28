import { Check } from "lucide-react";

import { AuthFigure } from "@/components/margin/auth/auth-figure";
import { Logo } from "@/components/margin/shell/logo";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface AuthPanelLabels {
  brand: string;
  /** One line on what this is. Not a slogan. */
  headline: string;
  /** Facts about the product. Never testimonials — see ADR-0002. */
  points: string[];
  /** Legally required, and the reason it appears on the way in. */
  disclaimer: string;
}

/**
 * The two-column frame every auth and onboarding screen sits in.
 *
 * **Form left, panel right, and the panel is decoration.** Everything a person
 * needs in order to act is in the left column, which is also the only column
 * below `lg`. That ordering is the accessible one as well as the responsive
 * one: the form comes first in the DOM, so tab order and reading order reach
 * the inputs without traversing marketing copy.
 *
 * What the right column may contain is constrained by ADR-0002: no
 * testimonials, no ratings, no student counts, no faces. What is left is the
 * argument from depth — what is here, in both languages, and what it costs to
 * leave. Those are facts, and they arrive as props like every other string in
 * `components/margin/`.
 *
 * The risk disclaimer sits here rather than only in the footer because this is
 * a financial-education product and the sign-up screen is where someone
 * decides to buy one.
 */
function AuthLayout({
  labels,
  children,
}: {
  labels: AuthPanelLabels;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
      {/* Form column. The `<main>` landmark, because it is the only column
          that holds anything actionable and the only one that exists below
          `lg`. */}
      <main id="main" className="flex flex-col px-6 py-10 sm:px-10">
        <Link href="/" className="inline-flex w-fit" aria-label={labels.brand}>
          <Logo alt="" className="h-7" sizes="200px" />
        </Link>

        {/*
         * Centred vertically in the space the logo leaves, not in the
         * viewport, so the form does not drift under the logo on a short
         * window. `flex-1` plus `justify-center` does both without a
         * calculation that would have to be re-derived when the logo changes.
         */}
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="measure-narrow w-full">{children}</div>
        </div>
      </main>

      {/* Design column */}
      <aside
        className={cn(
          "relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-end",
          // A tinted surface rather than a photograph. Stock photography of a
          // trading desk reads as editorial and quietly becomes permanent —
          // the same reasoning that made course covers generated art.
          "bg-subtle",
        )}
      >
        {/*
         * Held well below full strength. At full opacity the stroke reads as
         * the loudest thing on the screen and competes with the form, which
         * is the one thing on this page anybody came here to use.
         */}
        <AuthFigure className="absolute inset-0 size-full opacity-45" />

        {/*
         * A wash between the figure and the text.
         *
         * It is opaque where the copy sits and clears toward the top, so the
         * figure reads as a background rather than as something the headline
         * is printed on. Without it the stroke crosses the headline at
         * whatever height the viewport happens to put it, and the contrast
         * measurement moves with the window — the copy passed on a laptop and
         * failed on a tall monitor.
         */}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-subtle from-40% via-subtle/90 via-70% to-transparent"
        />

        <div className="relative flex flex-col gap-6 p-10 xl:p-14">
          <p className="font-heading text-display-sm text-balance text-foreground">
            {labels.headline}
          </p>

          <ul className="flex flex-col gap-2.5">
            {labels.points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2.5 text-sm text-subtle-foreground"
              >
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-4xl bg-brand-muted text-brand-muted-foreground">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>

          <p className="measure-prose border-t border-border pt-5 text-xs text-muted-foreground">
            {labels.disclaimer}
          </p>
        </div>
      </aside>
    </div>
  );
}

export { AuthLayout };
