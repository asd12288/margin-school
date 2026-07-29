"use client";

import { useEffect } from "react";

import { capture } from "@/lib/analytics/posthog";
import { useConsent } from "@/lib/analytics/use-consent";

/**
 * Records that a visitor met the paywall.
 *
 * **This is the only paywall funnel signal that exists before Stripe does.**
 * Phase 10 turns on billing and immediately wants to know how many people saw
 * a locked surface and what happened next; that denominator cannot be
 * reconstructed retroactively, which is why observability.md insists a flow's
 * events ship with the flow rather than after it.
 *
 * Renders nothing, and lives in the browser because `capture()` does —
 * PostHog is client-side and is not loaded at all until the visitor consents.
 * `useConsent()` is a dependency rather than a guard, for the reason spelled
 * out in `identity.tsx`: someone who accepts the banner after this rendered
 * would otherwise never be counted.
 *
 * **One event per surface, not one per card.** A catalog with six locked
 * courses is one encounter with the paywall, not six, and per-card events
 * would make "how many people hit the wall" a division problem. The two counts
 * keep the denial reasons distinct — "pay" and "not yet" are different
 * problems and collapsing them loses the difference (ADR-0006).
 *
 * No personal data in the properties, per rule 11 — counts and a surface name.
 */
export function PaywallViewed({
  surface,
  subscriptionLockedCount,
  prerequisiteLockedCount,
}: {
  /** Where the wall was met. `catalog` today; `lesson` and `course` follow. */
  surface: "catalog";
  subscriptionLockedCount: number;
  prerequisiteLockedCount: number;
}) {
  const consent = useConsent();

  useEffect(() => {
    if (subscriptionLockedCount === 0 && prerequisiteLockedCount === 0) return;

    capture("paywall_viewed", {
      surface,
      subscription_locked_count: subscriptionLockedCount,
      prerequisite_locked_count: prerequisiteLockedCount,
    });
  }, [surface, subscriptionLockedCount, prerequisiteLockedCount, consent]);

  return null;
}
