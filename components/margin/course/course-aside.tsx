import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { CourseCover } from "@/components/margin/course-cover";
import { cn } from "@/lib/utils";

/**
 * The sticky panel beside a course.
 *
 * This is the single most commercial object on a Udemy course page: preview
 * thumbnail, price, struck-through price, "X hours left at this price",
 * "Add to cart", "Buy now", "30-Day Money-Back Guarantee", then a "This course
 * includes" list, then share and coupon links. ADR-0001 deletes the entire top
 * half of it — there is no cart, no per-course price, no coupon and no timer,
 * because access is one all-access subscription and nothing is sold per
 * course.
 *
 * The bottom half is worth keeping and is what this component is: the cover,
 * the facts about what is inside, and one call to action. It stays sticky for
 * the same reason Udemy's does — a course page is long, and the decision to
 * start is one a reader makes partway down it, not at the top.
 *
 * **Deliberately not sticky below `lg`.** A phone has no room for a second
 * column, so the panel renders inline, once, at its place in the flow. A
 * position-sticky element on a narrow screen either eats the viewport or
 * covers the end of the page — the same failure mode the consent banner
 * already caused once, and which is documented in docs/design-system.md.
 */

/** One line of "what is inside": an icon, and a fact. */
function CourseFact({
  icon: Icon,
  children,
  className,
  ...props
}: React.ComponentProps<"li"> & { icon?: LucideIcon }) {
  return (
    <li
      data-slot="course-fact"
      className={cn("flex items-center gap-2.5 text-sm text-foreground", className)}
      {...props}
    >
      {Icon ? (
        <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      ) : null}
      <span data-numeric>{children}</span>
    </li>
  );
}

function CourseAside({
  courseId,
  coverImageUrl,
  coverAlt,
  includesTitle,
  facts,
  action,
  secondaryAction,
  note,
  className,
  ...props
}: Omit<React.ComponentProps<"aside">, "children" | "action"> & {
  courseId: string;
  coverImageUrl?: string | null;
  coverAlt?: string;
  /** e.g. "What's inside" */
  includesTitle: React.ReactNode;
  /** `CourseFact` elements. */
  facts: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  /** Small print — "included with a subscription", typically. */
  note?: React.ReactNode;
}) {
  return (
    <aside
      data-slot="course-aside"
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-raised",
        "lg:sticky lg:top-20",
        className
      )}
      {...props}
    >
      <div className="relative aspect-video w-full">
        <CourseCover
          courseId={courseId}
          src={coverImageUrl}
          alt={coverAlt}
          className="size-full"
        />
      </div>

      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-3">
          {/*
           * `h2`, not a styled paragraph. This panel is a section of the page
           * with its own list under it, and a heading is what lets a screen
           * reader jump to it — the same argument `StateFrame` makes about
           * its own title.
           */}
          <h2 className="font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {includesTitle}
          </h2>
          <ul className="flex flex-col gap-2.5">{facts}</ul>
        </div>

        {action || secondaryAction ? (
          <div className="flex flex-col gap-2 border-t border-border pt-5">
            {action}
            {secondaryAction}
          </div>
        ) : null}

        {note ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{note}</p>
        ) : null}
      </div>
    </aside>
  );
}

export { CourseAside, CourseFact };
