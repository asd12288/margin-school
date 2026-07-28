"use client";

import { useLinkStatus } from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { RouteProgress } from "./route-progress";

/**
 * A navigation link that says two things: where you are, and that your click
 * registered.
 *
 * docs/ux-architecture.md asks for every click to be acknowledged within one
 * frame — an unacknowledged click reads as a broken app no matter how fast the
 * page eventually arrives. `useLinkStatus` is Next 16's hook for exactly that,
 * and it only works inside a descendant of `<Link>`, hence the inner
 * component.
 */
function PendingUnderline() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      data-pending={pending}
      className={cn(
        "pointer-events-none absolute inset-x-2 bottom-0 h-px origin-left",
        "bg-primary transition-transform duration-fast ease-quiet",
        "scale-x-0 data-[pending=true]:scale-x-100"
      )}
    />
  );
}

function NavLink({
  href,
  segment,
  label,
  className,
}: {
  /** Canonical route key from i18n/routing.ts — `/courses`, `/learn`, … */
  href: React.ComponentProps<typeof Link>["href"];
  /** The layout segment this link owns, or null for the group's index. */
  segment: string | null;
  label: string;
  className?: string;
}) {
  const active = useSelectedLayoutSegment() === segment;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        // `whitespace-nowrap` is not cosmetic: without it a two-word label
        // wraps as soon as the row gets tight, and "Mes cours" broke across
        // two lines inside a 56px header on a 375px screen — which then
        // pushed the header taller than its own `h-14`. French supplies the
        // two-word labels ("Mes cours", "Mot de passe"), so this only ever
        // showed up in the locale most users are in.
        "relative rounded-4xl px-2 py-1 text-sm whitespace-nowrap outline-none",
        "transition-colors duration-fast ease-quiet",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {label}
      <PendingUnderline />
      <RouteProgress />
    </Link>
  );
}

export { NavLink };
