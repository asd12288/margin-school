"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import {
  CONSENT_CHANGE_EVENT,
  readConsent,
  type ConsentState,
} from "@/lib/analytics/consent";
import { capturePageview, initPostHog } from "@/lib/analytics/posthog";

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
  const [consent, setConsent] = useState<ConsentState>("unset");

  useEffect(() => {
    setConsent(readConsent());

    const onChange = (event: Event) => {
      setConsent((event as CustomEvent<ConsentState>).detail);
    };

    window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
  }, []);

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
