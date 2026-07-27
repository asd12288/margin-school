import { setRequestLocale } from "next-intl/server";

/**
 * Public shell — marketing, catalog, course pages.
 *
 * Chrome arrives in Task 7. What matters here is that the layout is static:
 * nothing in it may read cookies, headers or the session, or every page
 * beneath it becomes dynamic and Tier 1 in docs/ux-architecture.md is lost.
 * `unstable_instant` in Task 13 turns that rule into a build failure.
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

  return children;
}
