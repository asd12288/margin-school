"use client";

import posthog from "posthog-js";

import { APP_ENV, RELEASE, isLocal } from "@/lib/env";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

/** Off locally unless explicitly opted in, so dev noise never pollutes real funnels. */
const enabledForEnv =
  !isLocal || process.env.NEXT_PUBLIC_POSTHOG_ENABLE_LOCAL === "true";

let ready = false;

export function isAnalyticsReady() {
  return ready;
}

export function analyticsStatus() {
  return {
    ready,
    keyConfigured: Boolean(POSTHOG_KEY),
    enabledForEnv,
    host: POSTHOG_HOST,
  };
}

/**
 * Called only after the visitor grants consent — see lib/analytics/consent.ts.
 * PostHog is never loaded before that point.
 */
export function initPostHog() {
  if (ready || !POSTHOG_KEY || !enabledForEnv) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: "https://eu.posthog.com",
    defaults: "2025-05-24",
    // We capture pageviews ourselves: the App Router does client-side
    // navigation, which automatic capture would miss.
    capture_pageview: false,
    person_profiles: "identified_only",
  });

  // Every event carries the environment and release, so production funnels
  // are never contaminated by preview or local traffic.
  posthog.register({
    environment: APP_ENV,
    ...(RELEASE ? { release: RELEASE } : {}),
  });

  ready = true;
}

/**
 * The only sanctioned way to send a product event.
 *
 * Returns false when analytics is not running (no consent, no key, or
 * disabled for this environment) so callers can surface that in debug UI.
 * Never throws — a failed analytics call must not break a user flow.
 */
export function capture(
  event: string,
  properties?: Record<string, unknown>,
): boolean {
  if (!ready) return false;

  try {
    posthog.capture(event, properties);
    return true;
  } catch {
    return false;
  }
}

export function capturePageview(url: string) {
  return capture("$pageview", { $current_url: url });
}

/**
 * Ties this browser's events to a person.
 *
 * docs/observability.md calls this the single biggest unlock of Phase 4: until
 * it exists every session is a stranger and retention — the metric that
 * actually matters for a subscription — cannot be computed at all.
 *
 * **The id and nothing else.** No email, no name. Rule 2 of the taxonomy keeps
 * personal data out of PostHog, and a user id is enough to join sessions
 * together, which is the whole job.
 *
 * Returns false when analytics is not running, exactly like `capture`, so a
 * signed-in visitor who has not consented is simply never identified.
 */
export function identify(userId: string): boolean {
  if (!ready) return false;

  try {
    posthog.identify(userId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Drops the association on sign-out, so a second person signing in on the same
 * browser does not inherit the first one's identity.
 */
export function resetIdentity(): boolean {
  if (!ready) return false;

  try {
    posthog.reset();
    return true;
  } catch {
    return false;
  }
}
