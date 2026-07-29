import * as React from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Browse by category.
 *
 * Udemy's version of this is its densest module — "Popular Skills", four
 * columns of topic links with a learner count beside each one. The counts are
 * social proof and go (ADR-0002); the structure stays, because browsing by
 * subject is how somebody who does not yet know what they want gets started,
 * and search only serves the person who already does.
 *
 * The tile is one link with `after:absolute after:inset-0`, the same technique
 * `CourseCard` uses: the whole tile is the target, but only the name is the
 * accessible link text, so a screen reader hears "Foundations" rather than
 * the tile's entire contents.
 */
function CategoryTile({
  href,
  name,
  description,
  count,
  icon: Icon,
  className,
  ...props
}: Omit<React.ComponentProps<"article">, "children"> & {
  href: string;
  name: React.ReactNode;
  description?: React.ReactNode;
  /** e.g. "6 courses" — already pluralised and translated by the caller. */
  count?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <article
      data-slot="category-tile"
      className={cn(
        "group/tile relative flex flex-col gap-2 rounded-xl border border-border bg-card p-5 shadow-card",
        "transition-[border-color,box-shadow,transform] duration-base ease-quiet",
        "hover:-translate-y-1 hover:border-border-strong hover:shadow-raised",
        "focus-within:border-ring focus-within:shadow-raised",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {Icon ? (
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-lg bg-brand-muted text-brand-muted-foreground"
          >
            <Icon className="size-4" />
          </span>
        ) : null}
        <h3 className="font-heading text-base font-semibold text-card-foreground">
          <a
            href={href}
            className="outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {name}
          </a>
        </h3>
        <ArrowRight
          aria-hidden
          className="ml-auto size-4 text-muted-foreground transition-transform duration-base ease-quiet group-hover/tile:translate-x-0.5"
        />
      </div>

      {description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}

      {count ? (
        <span data-numeric className="mt-auto pt-2 text-xs text-muted-foreground">
          {count}
        </span>
      ) : null}
    </article>
  );
}

function CategoryGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="category-grid"
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4",
        className
      )}
      {...props}
    />
  );
}

export { CategoryGrid, CategoryTile };
