import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { describeAccess } from "@/lib/entitlement/can-access";
import { APP_ENV, RELEASE } from "@/lib/env";
import { hasDebugAccess } from "@/lib/observability/debug-access";

/**
 * Proves this environment can actually reach its database, and whether the
 * schema has been applied there. Deliberately defensive: a missing connection
 * string or an unreachable host is reported, never thrown, so the rest of the
 * report still renders.
 */
async function checkDatabase() {
  const started = Date.now();

  try {
    const { sql } = await import("drizzle-orm");
    const { db } = await import("@/lib/db/client");

    await db.execute(sql`select 1`);

    const applied = await db.execute<{ exists: boolean }>(
      sql`select to_regclass('public.profile') is not null as exists`,
    );

    return {
      reachable: true,
      latencyMs: Date.now() - started,
      profileTableExists: Boolean(applied[0]?.exists),
    };
  } catch (error) {
    return {
      reachable: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Verification endpoint for the observability wiring. Works in every
 * environment — you cannot verify production monitoring from staging —
 * and is gated by OBSERVABILITY_DEBUG_TOKEN.
 *
 *   GET /api/debug/observability?token=…             → environment report
 *   GET /api/debug/observability?token=…&throw=1     → server error into Sentry
 */
/**
 * Whether the request carries a valid session, and whether the Data Access
 * Layer can resolve it to a profile. Reports identifiers only — never an
 * email — so the endpoint stays safe to read in production.
 */
async function checkAuth() {
  try {
    const { getCurrentUser, getCurrentProfile } = await import("@/lib/auth/dal");

    const user = await getCurrentUser();
    if (!user) return { signedIn: false };

    const profile = await getCurrentProfile();

    return {
      signedIn: true,
      userId: user.id,
      // False here means the signup trigger did not fire — a real defect,
      // worth surfacing rather than silently treating as "no access".
      profileFound: Boolean(profile),
      role: profile?.role ?? null,
      locale: profile?.locale ?? null,
      // Through the boundary, not around it. Reporting the raw column here
      // would be a second reader of subscription status outside
      // lib/entitlement/** — harmless in itself, but the lint rule from
      // ADR-0006 cannot distinguish a diagnostic read from a gate, and an
      // exemption is how that rule would start eroding. This also makes the
      // panel verify entitlement rather than merely echo a column.
      entitlement: profile ? describeAccess(profile) : null,
    };
  } catch (error) {
    return {
      signedIn: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

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
    },
    database: {
      connectionSource: process.env.DATABASE_URL
        ? "DATABASE_URL"
        : process.env.POSTGRES_URL
          ? "POSTGRES_URL"
          : null,
      ...(await checkDatabase()),
    },
    auth: await checkAuth(),
  });
}
