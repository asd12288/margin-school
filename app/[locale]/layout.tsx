import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "../globals.css";

import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";

import { ConsentBanner } from "@/components/consent-banner";
import { ThemeProvider } from "@/components/theme-provider";
import { AnalyticsProvider } from "@/lib/analytics/posthog-provider";

/**
 * Two faces, two jobs.
 *
 * Inter runs everything — interface and lesson body alike. Headings separate
 * themselves by weight and tight tracking rather than by a second typeface,
 * which is what keeps the product looking current and the font payload at two
 * files. JetBrains Mono is for figures, symbols and code.
 *
 * Both are self-hosted at build time by `next/font`, so no request ever
 * reaches Google from a user's browser. That is what keeps them compatible
 * with the EU-processor rule in AGENTS.md.
 *
 * `latin-ext` matters: French needs the accented glyphs, and without the
 * subset they fall back to a system face mid-sentence.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Margin School",
  description: "Learn the financial markets, from the beginning.",
};

/**
 * Prerender both locales. Without this every page falls back to dynamic
 * rendering and Tier 1 in docs/ux-architecture.md is lost — which is exactly
 * what happened before the `[locale]` segment existed.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // A URL can carry anything. `/de/…` must 404 rather than silently render in
  // French, which would hand Google a page whose `lang` lies about it.
  if (!hasLocale(routing.locales, locale)) notFound();

  // Opts this render into static generation. Skipping it is the single most
  // common next-intl mistake: everything still works, and every page silently
  // becomes dynamic.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      // next-themes writes the theme class on <html> before paint; without
      // this React warns that the server and client markup disagree.
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <ThemeProvider>
            <AnalyticsProvider>{children}</AnalyticsProvider>
            <ConsentBanner />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
