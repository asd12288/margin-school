"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";

import { grantAnalyticsConsent } from "@/lib/analytics/consent";
import { analyticsStatus, capture } from "@/lib/analytics/posthog";
import { useConsent } from "@/lib/analytics/use-consent";
import type { AppEnv } from "@/lib/env";

type Result = { ok: boolean; text: string };

export function ObservabilityPanel({
  appEnv,
  release,
  token,
  sentryDsnConfigured,
}: {
  appEnv: AppEnv;
  release: string | null;
  token: string;
  sentryDsnConfigured: boolean;
}) {
  const [results, setResults] = useState<Record<string, Result>>({});
  const consent = useConsent();
  const [analytics, setAnalytics] = useState(() => analyticsStatus());

  // PostHog reports readiness from a module-level flag rather than an event,
  // so poll it. Cheap, and only on a debug page.
  useEffect(() => {
    const id = setInterval(() => setAnalytics(analyticsStatus()), 500);
    return () => clearInterval(id);
  }, []);

  const record = (key: string, result: Result) =>
    setResults((prev) => ({ ...prev, [key]: result }));

  async function testClientError() {
    const error = new Error(`[smoke-test] client error from ${appEnv}`);
    const eventId = Sentry.captureException(error, {
      tags: { smoke_test: "client", environment: appEnv },
    });
    await Sentry.flush(2000);
    record("clientError", {
      ok: Boolean(eventId),
      text: eventId
        ? `sent — event ${eventId}`
        : "not sent (Sentry disabled in this environment)",
    });
  }

  async function testServerError() {
    const res = await fetch(
      `/api/debug/observability?token=${encodeURIComponent(token)}&throw=1`,
    );
    const body = await res.json();
    record("serverError", {
      ok: body.sent === true,
      text: body.sent ? `sent — ${body.message}` : "not sent",
    });
  }

  function testAnalyticsEvent() {
    const sent = capture("smoke_test_event", {
      environment: appEnv,
      source: "debug-panel",
    });
    record("analyticsEvent", {
      ok: sent,
      text: sent
        ? "sent — event 'smoke_test_event'"
        : "not sent (needs consent, a key, and to be enabled for this environment)",
    });
  }

  return (
    <main className="mx-auto max-w-2xl p-8 font-mono text-sm">
      <h1 className="mb-1 text-lg font-semibold">Observability smoke test</h1>
      <p className="mb-6 opacity-60">
        Not indexed. Gated by OBSERVABILITY_DEBUG_TOKEN.
      </p>

      <dl className="mb-8 grid grid-cols-[10rem_1fr] gap-y-1">
        <dt className="opacity-60">environment</dt>
        <dd className="font-semibold">{appEnv}</dd>
        <dt className="opacity-60">release</dt>
        <dd>{release ?? "—"}</dd>
        <dt className="opacity-60">sentry dsn</dt>
        <dd>{sentryDsnConfigured ? "configured" : "missing"}</dd>
        <dt className="opacity-60">posthog key</dt>
        <dd>{analytics.keyConfigured ? "configured" : "missing"}</dd>
        <dt className="opacity-60">posthog enabled</dt>
        <dd>{analytics.enabledForEnv ? "yes" : "no (local opt-in)"}</dd>
        <dt className="opacity-60">posthog loaded</dt>
        <dd>{analytics.ready ? "yes" : "no"}</dd>
        <dt className="opacity-60">consent</dt>
        <dd>{consent}</dd>
      </dl>

      <div className="flex flex-col gap-3">
        <Row
          label="Sentry — client error"
          onClick={testClientError}
          result={results.clientError}
        />
        <Row
          label="Sentry — server error"
          onClick={testServerError}
          result={results.serverError}
        />
        <Row
          label="PostHog — capture event"
          onClick={testAnalyticsEvent}
          result={results.analyticsEvent}
        />
        {consent !== "granted" ? (
          <Row
            label="Grant analytics consent"
            onClick={grantAnalyticsConsent}
            result={undefined}
          />
        ) : null}
      </div>
    </main>
  );
}

function Row({
  label,
  onClick,
  result,
}: {
  label: string;
  onClick: () => void | Promise<void>;
  result: Result | undefined;
}) {
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        className="w-fit rounded border border-current/30 px-3 py-1.5 hover:bg-current/5"
      >
        {label}
      </button>
      {result ? (
        <span className={result.ok ? "text-success" : "text-warning"}>
          {result.ok ? "✓" : "✗"} {result.text}
        </span>
      ) : null}
    </div>
  );
}
