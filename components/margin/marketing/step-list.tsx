import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * How it works, in three or four steps.
 *
 * An ordered list, because the order is the content — this is the one module
 * on the page where "second" means something. The visible numerals come from
 * the markup's own counter rather than from a prop, so a caller cannot number
 * them 1, 2, 4.
 *
 * The connecting rule between markers is drawn with a pseudo-element on every
 * item except the last, which is why the marker column has a fixed width: the
 * rule has to line up with the centre of the numeral at every step, and a
 * column sized by its content moves when the numbers reach double digits.
 */
function StepList({
  className,
  children,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="step-list"
      className={cn("flex flex-col", className)}
      {...props}
    >
      {children}
    </ol>
  );
}

function Step({
  index,
  title,
  description,
  last = false,
  className,
  ...props
}: Omit<React.ComponentProps<"li">, "title"> & {
  /** Displayed numeral. The caller owns it because it is the list's real
   *  content, but `StepList` renders them in order, so it should be `i + 1`. */
  index: number;
  title: React.ReactNode;
  description?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <li
      data-slot="step"
      className={cn("relative flex gap-5 pb-8 last:pb-0", className)}
      {...props}
    >
      <div className="flex flex-col items-center">
        <span
          data-numeric
          className="flex size-9 shrink-0 items-center justify-center rounded-4xl border border-border bg-card font-mono text-sm font-medium text-primary-text shadow-card"
        >
          {index}
        </span>
        {last ? null : (
          <span aria-hidden className="mt-2 w-px grow bg-border" />
        )}
      </div>

      <div className="flex flex-col gap-1.5 pt-1.5">
        <h3 className="font-heading text-base font-semibold text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="measure-prose text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export { Step, StepList };
