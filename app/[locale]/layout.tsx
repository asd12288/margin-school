import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "../globals.css";

import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
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

/**
 * Read the locale through `next/root-params`, not `await params`.
 *
 * Both return "fr" here, so the difference is invisible until a segment
 * below this one exports `unstable_instant`. Under that validator every
 * `await params` resolves only at the *runtime* stage — unconditionally,
 * even for a root param, even one enumerated in the config's `samples`
 * (`createServerParamsInInstantValidation` in
 * `node_modules/next/dist/server/request/params.js` waits on
 * `sharedParamsParent`, which is `delayUntilStage(RenderStage.Runtime)`).
 * A root layout that awaits `params` therefore has no static shell at all,
 * and every `unstable_instant` route in the app fails its build-time check
 * with a "runtime data outside `<Suspense>`" error pointed, unhelpfully, at
 * whatever client provider happens to sit nearest the hole.
 *
 * `next/root-params` is the exemption: for a root param it resolves
 * immediately in that same validator (`getRootParam` in
 * `node_modules/next/dist/server/request/root-params.js`) because the value
 * is part of the route key, so a per-locale static shell genuinely exists.
 * It is the replacement for `unstable_rootParams`, which version-16.md still
 * describes as removed-with-no-alternative; the module ships but is
 * undocumented and untyped (`next/root-params.d.ts` is a bare
 * `declare module`), hence the annotation below.
 */
export default async function LocaleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale: string | undefined = await rootLocale();

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
