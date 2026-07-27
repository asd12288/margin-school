import { setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/margin/shell/app-header";
import { SkipLink } from "@/components/margin/shell/skip-link";
import { getShellLabels } from "@/lib/shell-labels";

/**
 * App shell — the signed-in product.
 *
 * This layout does **not** check auth. Layouts do not re-run on soft
 * navigation between sibling routes, so a layout-only gate is bypassable by
 * client navigation. Each page calls `requireProfile()` itself; see
 * lib/auth/dal.ts. Keeping the check out of here is also what lets the frame
 * stay static and render instantly.
 */
export default async function AppLayout({
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
