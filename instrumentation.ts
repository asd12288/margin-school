import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * Forwards server-side render and route handler errors to Sentry.
 * Without this, only unhandled exceptions reach Sentry — errors caught
 * by Next's own error boundaries would be silently swallowed.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  ...args
) => {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
};
