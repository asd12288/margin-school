import { setRequestLocale } from "next-intl/server";

/**
 * Design system and debug surfaces. No product chrome by design — they are
 * reference pages, and shell furniture would only get in the way of reading
 * what they show.
 */
export default async function InternalLayout({
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
