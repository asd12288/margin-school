import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { APP_ENV, RELEASE } from "@/lib/env";
import { hasDebugAccess } from "@/lib/observability/debug-access";

/**
 * Verification endpoint for the observability wiring. Works in every
 * environment — you cannot verify production monitoring from staging —
 * and is gated by OBSERVABILITY_DEBUG_TOKEN.
 *
 *   GET /api/debug/observability?token=…             → environment report
 *   GET /api/debug/observability?token=…&throw=1     → server error into Sentry
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  if (!hasDebugAccess(url.searchParams.get("token"))) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (url.searchParams.get("throw") === "1") {
    const error = new Error(
      `[smoke-test] server error from ${APP_ENV}`,
    );

    Sentry.captureException(error, {
      tags: { smoke_test: "server", environment: APP_ENV },
    });
    await Sentry.flush(2000);

    return NextResponse.json(
      { sent: true, kind: "server", environment: APP_ENV, message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    environment: APP_ENV,
    release: RELEASE ?? null,
    runtime: process.env.NEXT_RUNTIME ?? "nodejs",
    vercelEnv: process.env.VERCEL_ENV ?? null,
    sentry: {
      dsnConfigured: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
      clientActive: Sentry.getClient() !== undefined,
    },
    posthog: {
      keyConfigured: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY),
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      publishableKeyConfigured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      ),
      secretKeyConfigured: Boolean(process.env.SUPABASE_SECRET_KEY),
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    },
  });
}
