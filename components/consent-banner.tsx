"use client";

import {
  denyAnalyticsConsent,
  grantAnalyticsConsent,
} from "@/lib/analytics/consent";
import { useConsent } from "@/lib/analytics/use-consent";

/**
 * PROVISIONAL. Deliberately unstyled beyond the minimum — it exists so that
 * nothing is tracked without consent while the design system does not yet
 * exist. Restyle in Phase 2 (design tokens); the consent logic itself is
 * final and should not change.
 */
export function ConsentBanner() {
  const consent = useConsent();

  if (consent !== "unset") return null;

  return (
    <div
      role="dialog"
      aria-label="Analytics consent"
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 border-t border-black/10 bg-white p-4 text-sm text-black sm:flex-row sm:items-center sm:justify-between dark:border-white/15 dark:bg-neutral-900 dark:text-white"
    >
      <p className="max-w-2xl">
        We use analytics to understand how the courses are used. Nothing is
        recorded until you agree.
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={denyAnalyticsConsent}
          className="rounded border border-black/20 px-3 py-1.5 dark:border-white/25"
        >
          Refuse
        </button>
        <button
          type="button"
          onClick={grantAnalyticsConsent}
          className="rounded bg-black px-3 py-1.5 text-white dark:bg-white dark:text-black"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
