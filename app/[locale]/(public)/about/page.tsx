import { getTranslations, setRequestLocale } from "next-intl/server";

import { PlaceholderPage } from "@/components/margin/placeholder-page";

/**
 * Frame. The real page — who publishes this and how the courses are made —
 * is Phase 8.
 *
 * It exists now because the footer links to it, and this branch's rule is
 * that a footer link goes to a route that answers. Note what it cannot say
 * even when written: ADR-0002 bans invented people, so this page describes
 * the publisher and the method, never a founder's bio or a photo.
 */
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("pages.about");

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
