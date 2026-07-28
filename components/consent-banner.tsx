"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  denyAnalyticsConsent,
  grantAnalyticsConsent,
} from "@/lib/analytics/consent";
import { useConsent } from "@/lib/analytics/use-consent";

/**
 * Styled onto the design tokens — the "restyle in Phase 2" this comment used
 * to defer has shipped. The consent logic below is unchanged and is not
 * touched here: `lib/analytics/consent.ts` is explicit that it is final.
 */
export function ConsentBanner() {
  const consent = useConsent();
  const t = useTranslations("consent");

  if (consent !== "unset") return null;

  return (
    <div
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
