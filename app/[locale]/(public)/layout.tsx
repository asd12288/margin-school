import { getTranslations, setRequestLocale } from "next-intl/server";

import { SiteFooter } from "@/components/margin/shell/site-footer";
import { SiteHeader } from "@/components/margin/shell/site-header";
import { SkipLink } from "@/components/margin/shell/skip-link";
import { getShellLabels } from "@/lib/shell-labels";

/**
 * Public shell — marketing, catalog, course pages.
 *
 * Static except for the account slot's Suspense boundary inside the header.
 * Nothing here may read cookies, headers or the session, or every page beneath
 * it becomes dynamic and Tier 1 is lost. Task 13's `unstable_instant` makes
 * that a build failure rather than a thing to remember.
 */
export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const labels = await getShellLabels();
  const t = await getTranslations();

  return (
    <>
      <SkipLink label={labels.skipToContent} />
      <SiteHeader labels={labels} />
      <div id="main" className="flex flex-1 flex-col">
        {children}
      </div>
      <SiteFooter labels={{ brand: labels.brand, disclaimer: t("shell.disclaimer") }} />
    </>
  );
}
