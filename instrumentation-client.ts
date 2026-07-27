import * as Sentry from "@sentry/nextjs";

import { sharedSentryOptions } from "@/lib/observability/sentry-options";

Sentry.init({
  ...sharedSentryOptions,

  // Session Replay is deliberately off. It records the DOM, which on a
  // logged-in study page means recording a real person's activity — that
  // needs a consent decision first. Revisit alongside the consent banner.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

/**
 * Ties client-side navigations into Sentry tracing so a slow or failing
 * route transition is attributable to the navigation that caused it.
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
