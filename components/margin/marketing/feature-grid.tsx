import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * What a subscription gets you, as a grid of facts.
 *
 * This is the slot Udemy fills with "Udemy is trusted by over 17,000
 * companies" and a wall of client logos. ADR-0002 forbids that outright — we
 * do not have those companies and will not invent them — and the replacement
 * is not a weaker version of social proof, it is a different argument
 * entirely: what is actually here, stated plainly. Same position on the page,
 * opposite rhetoric.
 *
 * The icon distinguishes cards at a glance so nobody has to read four headings
 * to find the one they want. It is decorative — the heading says the same
 * thing — so it is hidden from assistive technology.
 */
function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div
      data-slot="feature-card"
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card",
        "transition-[border-color,box-shadow] duration-base ease-quiet",
        "hover:border-border-strong hover:shadow-raised",
        className
      )}
      {...props}
    >
      {Icon ? (
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-lg bg-primary-muted text-primary-text"
        >
          <Icon className="size-4.5" />
        </span>
      ) : null}
      <h3 className="font-heading text-base font-semibold text-card-foreground">
        {title}
      </h3>
      {description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** Sized by a comfortable card width rather than a column count, so French
 *  copy — 15–20% longer than English — gets the same room without a
 *  breakpoint per locale. Same rule as `CourseGrid`. */
function FeatureGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feature-grid"
      className={cn(
        "grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4",
        className
      )}
      {...props}
    />
  );
}

export { FeatureCard, FeatureGrid };
