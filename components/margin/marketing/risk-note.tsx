import * as React from "react";
import { ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The risk disclaimer, as a standalone panel for marketing pages.
 *
 * `lesson/blocks.tsx` already renders a `risk`-toned callout, but that one is
 * a *block* — it belongs to a lesson, arrives from the content tables, and is
 * styled for a reading column with a left rule and a `measure-prose` width.
 * This is the page-level equivalent: same tokens, same tone, no dependency on
 * a `CalloutBlock` payload the home page does not have.
 *
 * Keeping the styling in step matters more than sharing the code. Both use
 * `--destructive` as a left rule over `--destructive-muted`, and the title
 * takes `--destructive-muted-foreground` rather than the solid role — that is
 * the contrast fix the design-system audit found, on precisely this callout,
 * which is the one that is legally required to be readable.
 *
 * `<aside>` rather than a bare `div`: it is complementary to the page's main
 * argument and screen-reader users benefit from being able to skip to it.
 */
function RiskNote({
  title,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<"aside">, "title"> & {
  title: React.ReactNode;
}) {
  return (
    <aside
      data-slot="risk-note"
      className={cn(
        "flex flex-col gap-2 rounded-r-lg border-l-2 border-l-destructive bg-destructive-muted/50 py-4 pr-5 pl-5",
        className
      )}
      {...props}
    >
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-destructive-muted-foreground uppercase">
        <ShieldAlert className="size-3.5" />
        {title}
      </p>
      <p className="measure-wide text-prose-sm text-foreground">{children}</p>
    </aside>
  );
}

export { RiskNote };
