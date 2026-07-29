import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The two list shapes a course page needs, and nothing else.
 *
 * Udemy's course page runs three of these — "What you'll learn" as a boxed
 * two-column checklist, "Requirements" as bullets, "Who this course is for" as
 * bullets. The distinction it draws is the right one and worth keeping: a
 * check means *you will be able to do this*, a bullet means *this is a fact
 * about the course*. Conflating them turns prerequisites into promises.
 *
 * Both take `React.ReactNode[]`, not strings, so a caller can put a link or an
 * emphasis inside an item. Neither contains copy.
 */

/* -------------------------------------------------------------------------
   Checks — outcomes
   ------------------------------------------------------------------------- */

/**
 * Two columns above `sm`, one below. Not a `columns-2` flow: that reads top to
 * bottom in the left column and then jumps back up, which is wrong for an
 * ordered set of outcomes. A grid keeps reading order and visual order the
 * same.
 */
function CheckList({
  items,
  columns = 2,
  className,
  ...props
}: Omit<React.ComponentProps<"ul">, "children"> & {
  items: React.ReactNode[];
  columns?: 1 | 2;
}) {
  return (
    <ul
      data-slot="check-list"
      className={cn(
        "grid gap-x-8 gap-y-3",
        columns === 2 ? "sm:grid-cols-2" : null,
        className
      )}
      {...props}
    >
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
          <span
            aria-hidden
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-4xl bg-success-muted text-success-muted-foreground"
          >
            <Check className="size-2.5" strokeWidth={3} />
          </span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------
   Bullets — facts
   ------------------------------------------------------------------------- */

/** Prerequisites, audience — statements about the course, not promises to the
 *  reader. */
function BulletList({
  items,
  className,
  ...props
}: Omit<React.ComponentProps<"ul">, "children"> & {
  items: React.ReactNode[];
}) {
  return (
    <ul
      data-slot="bullet-list"
      className={cn("flex flex-col gap-2.5", className)}
      {...props}
    >
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
        >
          <span
            aria-hidden
            className="mt-2 size-1.5 shrink-0 rounded-4xl bg-border-strong"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export { BulletList, CheckList };
