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
 */
export default async function ObservabilityDebugPage({
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
