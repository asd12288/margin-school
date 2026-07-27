import { setRequestLocale } from "next-intl/server";

/**
 * Admin frame. Chrome is Phase 7, when the content studio knows what it needs.
 * As above, the gate lives in the page, not here.
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

  return children;
}
