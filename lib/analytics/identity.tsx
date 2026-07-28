"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { identify, resetIdentity } from "@/lib/analytics/posthog";
import { useConsent } from "@/lib/analytics/use-consent";

/**
 * Attaches the signed-in user's id to PostHog and Sentry.
 *
 * Renders nothing. It exists as a component because both calls belong in the
 * browser and have to re-run when either input changes — who is signed in, and
 * whether analytics has been allowed to load.
 *
 * **Consent is a dependency, not a guard.** PostHog is not loaded until the
 * visitor agrees, so a user who is already signed in when they accept the
 * banner would otherwise stay anonymous for the rest of the session — the
 * identify call would have run once, against a library that was not there. The
 * `useConsent()` subscription is what re-runs it at the moment PostHog
 * appears.
 *
 * Sentry has no such gate: it carries no PII (`sendDefaultPii: false`), Session
 * Replay is off, and observability.md is explicit that a user **id** on an
 * error report is what turns "this happened 40 times" into "this hit 40
 * people". Never the email.
 */
function AnalyticsIdentity({ userId }: { userId: string }) {
  const consent = useConsent();

  useEffect(() => {
    identify(userId);
    Sentry.setUser({ id: userId });

    return () => {
      // Runs when the id changes or the signed-in shell unmounts — sign-out,
      // in practice. Without it the next person on this browser inherits the
      // last one's identity.
      resetIdentity();
      Sentry.setUser(null);
    };
  }, [userId, consent]);

  return null;
}

export { AnalyticsIdentity };
