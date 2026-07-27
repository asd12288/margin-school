import { setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/margin/shell/app-header";
import { SkipLink } from "@/components/margin/shell/skip-link";
import { getShellLabels } from "@/lib/shell-labels";

/**
 * Admin frame. Its own chrome is Phase 7, when the content studio knows what
 * it needs; until then staff keep the app header rather than losing their
 * navigation on the way in.
 *
 * As in the app shell, the gate lives in the page. A layout does not re-run on
 * soft navigation between siblings, so a role check here would be bypassable.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const labels = await getShellLabels();

  return (
    <>
      <SkipLink label={labels.skipToContent} />
      <AppHeader labels={labels} />
      <div id="main" className="flex flex-1 flex-col">
        {children}
      </div>
    </>
  );
}
