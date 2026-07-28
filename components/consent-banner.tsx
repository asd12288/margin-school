"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  denyAnalyticsConsent,
  grantAnalyticsConsent,
} from "@/lib/analytics/consent";
import { useConsent } from "@/lib/analytics/use-consent";

/** The custom property `app/globals.css` reserves space with. */
const HEIGHT_PROPERTY = "--consent-banner-height";

/**
 * Styled onto the design tokens — the "restyle in Phase 2" this comment used
 * to defer has shipped. The consent logic below is unchanged and is not
 * touched here: `lib/analytics/consent.ts` is explicit that it is final.
 *
 * The banner is `position: fixed`, so it does not take part in layout and
 * covers whatever the page ends with. On a phone that was the sign-out button
 * at the foot of onboarding and the delete-account field at the foot of
 * `/account` — scrollable to, and then unclickable, because a fixed overlay
 * intercepts the pointer wherever you scroll it to. `useBannerHeight` below
 * publishes its measured height so the page can reserve the space.
 */
export function ConsentBanner() {
  const consent = useConsent();
  const t = useTranslations("consent");
  const ref = useBannerHeight(consent === "unset");

  if (consent !== "unset") return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 border-t border-border bg-card p-4 text-sm text-card-foreground shadow-overlay sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="measure-prose text-card-foreground">{t("message")}</p>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" onClick={denyAnalyticsConsent}>
          {t("decline")}
        </Button>
        <Button size="sm" onClick={grantAnalyticsConsent}>
          {t("accept")}
        </Button>
      </div>
    </div>
  );
}

/**
 * Publishes the banner's height to the document, and clears it on the way out.
 *
 * **Measured, not hardcoded.** The height is not one number: below `sm` the
 * message wraps and the buttons drop onto their own row, and French runs
 * 15–20% longer than English, so the same breakpoint gives different heights
 * in the two locales. A constant would be wrong for most of the combinations
 * and would go stale the first time the copy changed.
 *
 * A `ResizeObserver` rather than a one-shot measurement, because the height
 * changes under the banner's own feet — on rotation, on a window resize, and
 * when the web font loads and reflows the paragraph.
 *
 * The property is set on `documentElement` rather than on the element itself:
 * `body` is the thing that needs the padding, and a custom property on the
 * banner would not be in scope for it.
 */
function useBannerHeight(visible: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    const root = document.documentElement;

    if (!visible || !element) {
      root.style.removeProperty(HEIGHT_PROPERTY);
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      root.style.setProperty(HEIGHT_PROPERTY, `${entry.target.clientHeight}px`);
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      // Runs the moment the visitor answers. Leaving it set would keep a
      // strip of empty space at the bottom of every page for the rest of the
      // session.
      root.style.removeProperty(HEIGHT_PROPERTY);
    };
  }, [visible]);

  return ref;
}
