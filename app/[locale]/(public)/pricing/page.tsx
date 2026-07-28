import { getTranslations, setRequestLocale } from "next-intl/server";

import { PlaceholderPage } from "@/components/margin/placeholder-page";

/**
 * Frame. Real plans and the checkout are Phase 10 (billing).
 *
 * **No number appears on this page and none should be invented here.** There
 * is one all-access subscription and nothing is sold per course (ADR-0001);
 * a price written as a placeholder is the kind of placeholder that gets
 * screenshotted. The copy states the shape of the offer — one subscription,
 * everything included — which is a settled decision, and stops there.
 */
export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("pages.pricing");

  return (
    <PlaceholderPage
      labels={{
        badge: t("badge"),
        title: t("title"),
        description: t("description"),
      }}
    />
  );
}
