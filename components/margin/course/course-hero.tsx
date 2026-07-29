import * as React from "react";

import { PriceFigure } from "@/components/margin/price-figure";
import { cn } from "@/lib/utils";

/**
 * The top of a course detail page.
 *
 * Udemy's version is a dark banner carrying, in order: the category
 * breadcrumb, the title, a subtitle, a "Bestseller" flag, a star rating, a
 * rating count, an enrolment count, "Created by <instructor>", the last-updated
 * date, and the language list. Six of those eleven are social proof or a
 * person, and ADR-0002 removes every one — there are no instructors here, no
 * ratings, and no student counts, because we would have to invent them.
 *
 * What is left is what the page is actually for: where this sits in the
 * catalog, what it is called, what it covers, and what state it is in for
 * *you* — free preview available, included with a subscription, not yet
 * written in your language. That last group is the honest replacement for the
 * badge row, and it is information Udemy's banner does not carry at all.
 *
 * `breadcrumb` is a slot rather than a prop shape, because the app already has
 * `components/ui/breadcrumb.tsx` and a second breadcrumb vocabulary here would
 * be a fork of it.
 *
 * The figure is the same decorative price series as the home hero and the auth
 * panel, at a lower opacity — a course page's subject is the course, and the
 * decoration should be recognisably the brand's without competing with the
 * title.
 */
function CourseHero({
  breadcrumb,
  eyebrow,
  title,
  summary,
  meta,
  badges,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  breadcrumb?: React.ReactNode;
  /** The category name, typically. */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  summary?: React.ReactNode;
  /** A `MetaRow` of duration / lessons / chapters. */
  meta?: React.ReactNode;
  /** Free preview, locked, unavailable-in-locale — the state chips. */
  badges?: React.ReactNode;
}) {
  return (
    <div
      data-slot="course-hero"
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-subtle/60 px-6 py-8 shadow-card sm:px-8 sm:py-10",
        className
      )}
      {...props}
    >
      <PriceFigure
        id="course-hero-figure"
        className="absolute inset-0 size-full opacity-25"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-r from-card from-30% via-card/85 via-75% to-transparent"
      />

      <div className="relative flex flex-col gap-4">
        {breadcrumb}

        {eyebrow ? (
          <span className="text-xs font-semibold tracking-wide text-primary-text uppercase">
            {eyebrow}
          </span>
        ) : null}

        <h1 className="measure-narrow font-heading text-display font-bold tracking-tight text-balance text-foreground">
          {title}
        </h1>

        {summary ? (
          <p className="measure-prose text-prose text-muted-foreground">
            {summary}
          </p>
        ) : null}

        {badges ? (
          <div className="flex flex-wrap items-center gap-2">{badges}</div>
        ) : null}

        {meta}
      </div>
    </div>
  );
}

export { CourseHero };
