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
