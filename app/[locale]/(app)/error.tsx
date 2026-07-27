"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { ErrorState } from "@/components/margin/states";

/**
 * Recoverable, with a retry. Never a bare stack trace —
 * docs/ux-architecture.md treats error as a designed state, not a fallback.
 *
 * `unstable_retry` is the Next 16 prop; older examples call it `reset`.
 */
export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("errors.unexpected");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <ErrorState
        className="measure-narrow"
        title={t("title")}
        description={t("description")}
        retryLabel={t("retry")}
        onRetry={unstable_retry}
      />
    </main>
  );
}
