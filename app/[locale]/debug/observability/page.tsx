import { Suspense } from "react";
import { notFound } from "next/navigation";

import { APP_ENV, RELEASE } from "@/lib/env";
import { hasDebugAccess } from "@/lib/observability/debug-access";

import { ObservabilityPanel } from "./panel";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Observability smoke-test panel. Available in every environment, gated by
 * OBSERVABILITY_DEBUG_TOKEN:
 *
 *   /debug/observability?token=…
 *
 * See docs/observability.md.
 *
 * The token read is split into its own component so the page shell prerenders
 * and only the gated part streams. Under Cache Components, awaiting
 * `searchParams` in the page body blocks the whole route and fails the build.
 */
export default function ObservabilityDebugPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <ObservabilityGate searchParams={searchParams} />
    </Suspense>
  );
}

async function ObservabilityGate({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!hasDebugAccess(token)) notFound();

  return (
    <ObservabilityPanel
      appEnv={APP_ENV}
      release={RELEASE ?? null}
      token={token as string}
      sentryDsnConfigured={Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)}
    />
  );
}
