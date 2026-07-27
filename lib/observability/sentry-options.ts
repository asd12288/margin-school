import { APP_ENV, RELEASE, isLocal, isProduction } from "@/lib/env";

/**
 * Options shared by the client, server and edge Sentry initialisations.
 *
 * One Sentry project, three environments — separated by the `environment`
 * tag rather than by separate projects. That is how Sentry is designed to
 * work: issues stay grouped across environments, and you filter by
 * environment in the UI.
 */
export const sharedSentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: APP_ENV,
  release: RELEASE,

  // Off locally unless explicitly opted in, so local noise never reaches
  // the dashboard. Set SENTRY_ENABLE_LOCAL=true to test the integration.
  enabled: !isLocal || process.env.NEXT_PUBLIC_SENTRY_ENABLE_LOCAL === "true",

  // Full tracing everywhere except production, where it would be costly
  // and where 10% is enough to spot a regression.
  tracesSampleRate: isProduction ? 0.1 : 1.0,

  // Never send IP addresses, cookies or headers by default. This is an
  // EU consumer product; PII in error reports is a liability, not a feature.
  sendDefaultPii: false,

  debug: false,
} as const;
