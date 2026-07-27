"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { capturePageview, initPostHog } from "@/lib/analytics/posthog";
import { useConsent } from "@/lib/analytics/use-consent";

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    capturePageview(
      window.location.origin + pathname + (query ? `?${query}` : ""),
    );
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const consent = useConsent();

  useEffect(() => {
    if (consent === "granted") initPostHog();
  }, [consent]);

  return (
    <>
      {consent === "granted" ? (
        <Suspense fallback={null}>
          <PageviewTracker />
        </Suspense>
      ) : null}
      {children}
    </>
  );
}
