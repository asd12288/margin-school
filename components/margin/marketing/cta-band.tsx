import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The closing ask.
 *
 * Deliberately the same ask as the header's, worded the same way. Udemy's
 * closing band is where the countdown and the struck-through price go — the
 * last chance to convert a purchase before the visitor leaves. There is no
 * purchase here to close (ADR-0001), so this band cannot manufacture urgency
 * and does not try to: it repeats the offer for somebody who has just finished
 * reading the page and no longer has the header in view.
 *
 * `note` carries the disclaimer, which belongs beside a call to action on a
 * financial-education product rather than only in the footer.
 */
function CtaBand({
  title,
  description,
  actions,
  note,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <div
      data-slot="cta-band"
      className={cn(
        "flex flex-col items-center gap-6 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-card",
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-3">
        <h2 className="font-heading text-display-sm font-bold text-balance text-card-foreground">
          {title}
        </h2>
        {description ? (
          <p className="measure-prose text-prose-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      ) : null}

      {note ? (
        <p className="measure-prose text-xs text-muted-foreground">{note}</p>
      ) : null}
    </div>
  );
}

export { CtaBand };
