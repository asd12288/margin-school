import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The page skeleton every public page is built from: a centred column, and a
 * band of vertical rhythm with an optional tinted ground.
 *
 * Both marketing surfaces — the home page and the course detail page — are a
 * stack of these, which is the point. Before this existed each page repeated
 * `mx-auto w-full max-w-6xl px-4 py-12 sm:px-6` inline, so the container width
 * and the rhythm between sections were a copy-paste convention rather than a
 * decision anywhere. Changing either now happens here.
 *
 * As with everything in `components/margin/`, no string appears in this file.
 */

/* -------------------------------------------------------------------------
   Container
   ------------------------------------------------------------------------- */

/**
 * The measure of the page itself, distinct from the measure of *text*
 * (`measure-narrow` / `measure-prose` / `measure-wide`, which are in `ch` and
 * belong on paragraphs). This one bounds layout, so it is in `rem`.
 */
function PageContainer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-container"
      className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------
   Section
   ------------------------------------------------------------------------- */

/**
 * `tone` paints the full width of the viewport while the content stays in the
 * container — the band is what separates one section from the next on a long
 * page, and a band that stopped at the container edge would read as a card.
 *
 * `bleed` opts out of the container for sections whose content must reach the
 * viewport edge on a phone: a horizontally scrolling course rail is the case
 * this exists for, and a rail that stops short of the edge does not read as
 * scrollable.
 */
function Section({
  tone = "plain",
  bleed = false,
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  tone?: "plain" | "muted" | "subtle";
  bleed?: boolean;
}) {
  const toneStyles = {
    plain: "",
    muted: "bg-muted/50",
    subtle: "bg-subtle/60",
  }[tone];

  return (
    <section
      data-slot="section"
      data-tone={tone}
      className={cn("py-14 sm:py-20", toneStyles, className)}
      {...props}
    >
      {bleed ? children : <PageContainer>{children}</PageContainer>}
    </section>
  );
}

/* -------------------------------------------------------------------------
   Section header
   ------------------------------------------------------------------------- */

/** Headings a section is willing to title itself with. Never `h1` — that
 *  belongs to the page, and a section that claims it breaks the outline. */
type SectionHeadingLevel = "h2" | "h3";

/**
 * Eyebrow, title, description, and an action that sits opposite the title on a
 * wide screen and beneath it on a narrow one.
 *
 * The eyebrow is a real element rather than styled text inside the heading:
 * screen readers announce the heading, and prefixing every one of them with a
 * category word makes the page's outline read as a list of categories.
 */
function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  headingLevel: Heading = "h2",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** A "see all" link, typically. */
  action?: React.ReactNode;
  headingLevel?: SectionHeadingLevel;
}) {
  return (
    <div
      data-slot="section-header"
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-2">
        {eyebrow ? (
          <span className="text-xs font-semibold tracking-wide text-primary-text uppercase">
            {eyebrow}
          </span>
        ) : null}
        <Heading className="font-heading text-display-sm font-bold text-balance text-foreground">
          {title}
        </Heading>
        {description ? (
          <p className="measure-prose text-prose-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export { PageContainer, Section, SectionHeader };
