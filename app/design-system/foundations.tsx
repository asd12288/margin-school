import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Foundations: what every component is assembled from.
 *
 * Each swatch names the role, not the value. That is the point of the whole
 * system — a component author picks `bg-locked`, never `bg-[#f5f4f2]`, and
 * never `bg-paper-100` either. The primitive ramps behind these roles are not
 * registered in `@theme`, so Tailwind never generates a utility for them and
 * reaching past this layer is not possible by accident.
 */

function Section({
  title,
  hint,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & {
  title: string;
  hint?: string;
}) {
  return (
    <section className={cn("scroll-mt-24", className)} {...props}>
      <div className="mb-5 border-b border-border pb-3">
        <h2 className="font-heading text-display-sm font-semibold text-foreground">
          {title}
        </h2>
        {hint ? (
          <p className="measure-wide mt-1.5 text-sm text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Swatch({
  name,
  className,
  border,
}: {
  name: string;
  className: string;
  border?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          "h-14 rounded-lg",
          border ? "border border-border-strong" : "border border-border",
          className
        )}
      />
      <code className="font-mono text-2xs text-muted-foreground">{name}</code>
    </div>
  );
}

function SwatchGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3">
      {children}
    </div>
  );
}

function ColourFoundations() {
  return (
    <Section
      id="colour"
      title="Colour"
      hint="Semantic roles only. The ramps behind them — neutral, indigo, cyan, emerald, rose, amber, red — are deliberately unreachable from a class name."
    >
      <div className="flex flex-col gap-8">
        <div>
          <h3 className="mb-3 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Surfaces
          </h3>
          <SwatchGrid>
            <Swatch name="background" className="bg-background" border />
            <Swatch name="card" className="bg-card" border />
            <Swatch name="popover" className="bg-popover" border />
            <Swatch name="muted" className="bg-muted" />
            <Swatch name="subtle" className="bg-subtle" />
            <Swatch name="sidebar" className="bg-sidebar" />
          </SwatchGrid>
        </div>

        <div>
          <h3 className="mb-3 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Brand
          </h3>
          <SwatchGrid>
            <Swatch name="primary" className="bg-primary" />
            <Swatch name="primary-muted" className="bg-primary-muted" />
            <Swatch name="secondary" className="bg-secondary" />
            <Swatch name="accent" className="bg-accent" />
            <Swatch name="accent-muted" className="bg-accent-muted" />
          </SwatchGrid>
        </div>

        <div>
          <h3 className="mb-3 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Status
          </h3>
          <SwatchGrid>
            <Swatch name="success" className="bg-success" />
            <Swatch name="info" className="bg-info" />
            <Swatch name="warning" className="bg-warning" />
            <Swatch name="destructive" className="bg-destructive" />
            <Swatch name="success-muted" className="bg-success-muted" />
            <Swatch name="info-muted" className="bg-info-muted" />
            <Swatch name="warning-muted" className="bg-warning-muted" />
            <Swatch name="destructive-muted" className="bg-destructive-muted" />
          </SwatchGrid>
        </div>

        <div>
          <h3 className="mb-3 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Market direction
          </h3>
          <p className="measure-wide mb-3 text-sm text-muted-foreground">
            Emerald and rose. Both carry a glyph as well as a colour wherever
            they appear, so direction survives colour blindness and greyscale.
          </p>
          <SwatchGrid>
            <Swatch name="gain" className="bg-gain" />
            <Swatch name="loss" className="bg-loss" />
            <Swatch name="flat" className="bg-flat" />
            <Swatch name="gain-muted" className="bg-gain-muted" />
            <Swatch name="loss-muted" className="bg-loss-muted" />
          </SwatchGrid>
        </div>

        <div>
          <h3 className="mb-3 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Learning states
          </h3>
          <SwatchGrid>
            <Swatch name="locked" className="bg-locked" border />
            <Swatch name="progress-track" className="bg-progress-track" />
            <Swatch name="progress-indicator" className="bg-progress-indicator" />
            <Swatch name="progress-complete" className="bg-progress-complete" />
            <Swatch name="free-preview" className="bg-free-preview" />
          </SwatchGrid>
        </div>

        <div>
          <h3 className="mb-3 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Chart
          </h3>
          <SwatchGrid>
            <Swatch name="chart-1" className="bg-chart-1" />
            <Swatch name="chart-2" className="bg-chart-2" />
            <Swatch name="chart-3" className="bg-chart-3" />
            <Swatch name="chart-4" className="bg-chart-4" />
            <Swatch name="chart-5" className="bg-chart-5" />
            <Swatch name="chart-grid" className="bg-chart-grid" border />
          </SwatchGrid>
        </div>
      </div>
    </Section>
  );
}

function TypographyFoundations() {
  return (
    <Section
      id="typography"
      title="Typography"
      hint="One family — Inter — for interface and reading alike, plus JetBrains Mono for figures. Headings separate themselves by weight and negative tracking rather than by a second typeface. Two scales, because lesson body text and interface text have different jobs."
    >
      <div className="flex flex-col gap-8">
        <div>
          <h3 className="mb-4 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Display — Inter, tight tracking
          </h3>
          <div className="flex flex-col gap-4">
            {[
              { cls: "text-display-xl", name: "text-display-xl" },
              { cls: "text-display-lg", name: "text-display-lg" },
              { cls: "text-display", name: "text-display" },
              { cls: "text-display-sm", name: "text-display-sm" },
            ].map(({ cls, name }) => (
              <div key={name} className="flex flex-col gap-1">
                <code className="font-mono text-2xs text-muted-foreground">
                  {name}
                </code>
                <p className={cn("font-heading font-semibold text-foreground", cls)}>
                  Reading a price chart
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Reading — Inter
          </h3>
          <div className="flex flex-col gap-5">
            {[
              { cls: "text-prose-lg", name: "text-prose-lg" },
              { cls: "text-prose", name: "text-prose" },
              { cls: "text-prose-sm", name: "text-prose-sm" },
            ].map(({ cls, name }) => (
              <div key={name} className="flex flex-col gap-1">
                <code className="font-mono text-2xs text-muted-foreground">
                  {name}
                </code>
                <p className={cn("measure-prose text-foreground", cls)}>
                  A candlestick is a summary. It takes everything that happened
                  to a price over one slice of time and compresses it into a
                  single shape you can read at a glance.
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Interface — Inter
          </h3>
          <div className="flex flex-col gap-3">
            {["text-base", "text-sm", "text-xs"].map((cls) => (
              <div key={cls} className="flex items-baseline gap-4">
                <code className="w-24 shrink-0 font-mono text-2xs text-muted-foreground">
                  {cls}
                </code>
                <p className={cn("font-sans text-foreground", cls)}>
                  Continue where you left off
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Figures — JetBrains Mono, tabular
          </h3>
          <div className="flex flex-col gap-1 font-mono text-sm text-foreground">
            <span data-numeric>1.0839</span>
            <span data-numeric>1.0785</span>
            <span data-numeric>1.0918</span>
          </div>
          <p className="measure-wide mt-3 text-sm text-muted-foreground">
            Tabular figures via <code className="font-mono text-xs">data-numeric</code>{" "}
            or the <code className="font-mono text-xs">numeric</code> utility.
            Digits keep the same width, so a column of prices aligns and a
            ticking value does not jitter.
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Measure
          </h3>
          <p className="measure-wide mb-4 text-sm text-muted-foreground">
            Set in <code className="font-mono text-xs">ch</code>, not pixels.
            French runs 15–20% longer than English; a measure in characters
            holds its reading comfort across both.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { cls: "measure-narrow", name: "measure-narrow — 46ch" },
              { cls: "measure-prose", name: "measure-prose — 68ch" },
              { cls: "measure-wide", name: "measure-wide — 88ch" },
            ].map(({ cls, name }) => (
              <div key={cls} className={cn("rounded-lg bg-muted p-3", cls)}>
                <code className="font-mono text-2xs text-muted-foreground">
                  {name}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function MotionFoundations() {
  return (
    <Section
      id="motion"
      title="Motion"
      hint="Durations and easings are tokens, exactly like colour. Routine feedback stays at or below 200ms; anything slower has to justify itself. Everything here stops under prefers-reduced-motion, enforced once globally rather than per component."
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3">
          {[
            ["duration-instant", "80ms", "State flips with no travel"],
            ["duration-fast", "140ms", "Hover, focus, colour"],
            ["duration-base", "200ms", "Enter and exit, most things"],
            ["duration-slow", "320ms", "Progress fills, card flip"],
            ["duration-deliberate", "480ms", "Rare, and never routine"],
          ].map(([name, value, use]) => (
            <div
              key={name}
              className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3"
            >
              <code className="font-mono text-2xs text-foreground">{name}</code>
              <span data-numeric className="font-mono text-xs text-accent">
                {value}
              </span>
              <span className="text-xs text-muted-foreground">{use}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
          {[
            ["ease-quiet", "Decelerating. The default for anything entering."],
            ["ease-quiet-in-out", "Symmetric. For things that move and settle."],
            ["ease-settle", "A slight overshoot. Used sparingly."],
          ].map(([name, use]) => (
            <div
              key={name}
              className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3"
            >
              <code className="font-mono text-2xs text-foreground">{name}</code>
              <span className="text-xs text-muted-foreground">{use}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function ShapeFoundations() {
  return (
    <Section
      id="shape"
      title="Shape and elevation"
      hint="Radii step from a single --radius. Shadows stay tight and cool; the primary action gets a coloured lift that nothing else in the interface has."
    >
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3">
          {["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-4xl"].map(
            (cls) => (
              <div key={cls} className="flex flex-col gap-1.5">
                <div className={cn("h-14 border border-border-strong bg-muted", cls)} />
                <code className="font-mono text-2xs text-muted-foreground">
                  {cls}
                </code>
              </div>
            )
          )}
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4">
          {["shadow-card", "shadow-raised", "shadow-overlay"].map((cls) => (
            <div key={cls} className="flex flex-col gap-2">
              <div className={cn("h-20 rounded-xl border border-border bg-card", cls)} />
              <code className="font-mono text-2xs text-muted-foreground">
                {cls}
              </code>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export {
  ColourFoundations,
  MotionFoundations,
  Section,
  ShapeFoundations,
  TypographyFoundations,
};
