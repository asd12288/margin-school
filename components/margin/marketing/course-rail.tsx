import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A horizontal row of course cards.
 *
 * This is Udemy's home-page module — "Trending courses", "Because you viewed
 * …", the row under every course page — and the reason to keep it is that a
 * grid cannot say *start here*. A grid presents six equals; a rail presents an
 * order, and a beginner's first question is which one is first.
 *
 * Three things make it work, and all three are easy to leave out:
 *
 * - **It is keyboard-reachable.** A scroll container that nothing inside it can
 *   focus is unreachable without a mouse. The cards here are links, so focus
 *   moves through them and the browser scrolls to follow — but the container
 *   still carries `role="group"` and a name, so its contents are announced as
 *   a set rather than as loose links in the page. (The design system already
 *   paid for this lesson once, on the lesson chart's scroll region, which
 *   passed every desktop check while stranding keyboard users.)
 * - **It reaches the viewport edge on a phone.** Padding inside the scroller
 *   rather than on it, so the first card lines up with the page container and
 *   the last one can still scroll clear of the edge. A rail that stops short
 *   of the edge does not read as scrollable.
 * - **Cards keep a fixed width.** A flex child with `min-w-0` collapses to fit;
 *   these must not, or the rail becomes a squashed grid.
 */
function CourseRail({
  label,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  /** Accessible name for the group, e.g. "Courses to start with". */
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-slot="course-rail"
      role="group"
      aria-label={label}
      className={cn(
        "-mx-4 overflow-x-auto overscroll-x-contain sm:-mx-6",
        // Scroll snapping makes a flick land on a card boundary rather than
        // mid-card. `proximity`, not `mandatory`: mandatory fights a
        // deliberate slow drag.
        "snap-x snap-proximity",
        className
      )}
      {...props}
    >
      <div className="flex w-max gap-5 px-4 pb-2 sm:px-6">
        {React.Children.map(children, (child) =>
          child == null ? null : (
            <div className="w-70 shrink-0 snap-start">{child}</div>
          )
        )}
      </div>
    </div>
  );
}

export { CourseRail };
