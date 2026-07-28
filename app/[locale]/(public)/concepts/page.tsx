import { getTranslations, setRequestLocale } from "next-intl/server";

import { PlaceholderPage } from "@/components/margin/placeholder-page";

/**
 * Frame. The concept index — ADR-0004's skill graph made public — is Phase 8
 * and after.
 *
 * This is the product's second taxonomy, alongside the catalog: courses are
 * the path you follow, concepts are what you end up knowing. Mastery attaches
 * here and never to a lesson (ADR-0004), which is why the two listings are
 * separate URLs rather than two filters on one.
 */
export default async function ConceptsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("pages.concepts");

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
