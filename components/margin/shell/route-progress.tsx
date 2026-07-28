"use client";

import { useLinkStatus } from "next/link";

import { cn } from "@/lib/utils";

/**
 * The second half of navigation feedback.
 *
 * docs/ux-architecture.md asks for a pending state on the link *and* a
 * top-level indicator for slower transitions. `NavLink` covers the first; this
 * covers the second, for navigations long enough that a 2px underline is not
 * reassurance enough.
 *
 * Like `useLinkStatus` itself, this must render inside a `<Link>`, so it is
 * mounted by `NavLink` rather than by the layout — a bar positioned fixed at
 * the top of the viewport from inside the link that is loading.
 */
function RouteProgress({ className }: { className?: string }) {
  const { pending } = useLinkStatus();

  if (!pending) return null;

  return (
    <span
      aria-hidden
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-primary",
        "animate-route-progress",
        className
      )}
    />
  );
}

export { RouteProgress };
