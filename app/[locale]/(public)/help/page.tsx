import { getTranslations, setRequestLocale } from "next-intl/server";

import { PlaceholderPage } from "@/components/margin/placeholder-page";

/**
 * Frame. The real help centre is not scheduled yet.
 *
 * This is the one route here that ADR-0011 did not settle — it was added
 * with the full footer, and the ADR and the route table in
 * docs/ux-architecture.md record it as such. Deliberately no contact address
 * or promised response time: inventing a support channel that nobody is
 * staffing is the same failure as inventing a person.
 */
export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("pages.help");

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
