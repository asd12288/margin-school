import { Suspense } from "react";
import { cookies } from "next/headers";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Compass } from "lucide-react";
import type { Metadata } from "next";

import "./globals.css";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/margin/states";
import { getPathname } from "@/i18n/navigation";
import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";

import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";

/**
 * The fallback documented in `not-found.md`, taken because Step 6 of Task 9
 * showed it was needed rather than assumed.
 *
 * `app/[locale]/not-found.tsx` renders correctly for a `notFound()` thrown
 * inside a route that *matched* — `requireRole`, or `/debug/observability`
 * without a token both confirmed this. What it cannot reach is a URL that
 * matches no route at all: a mistyped path, or an unknown locale prefix like
 * `/de/anything`, which the routing middleware rewrites to `/fr/de/anything`
 * before it ever enters the `[locale]` segment. That is exactly the second
 * case `not-found.md` names for `globalNotFound`: a root layout built on a
 * top-level dynamic segment has no single layout to compose a 404 from, so
 * Next.js falls back to its own generic, unstyled, unlocalised page instead
 * — confirmed against this app by hitting `/fr/does-not-exist` before this
 * file existed.
 *
 * `global-not-found.js` is "handled at the routing level" per the docs: it
 * bypasses `app/[locale]/layout.tsx` entirely, so none of `NextIntlClientProvider`,
 * `ThemeProvider`, or the request-scoped locale that `i18n/request.ts` resolves
 * from the `[locale]` segment are available here. Unlike `global-error.tsx`
 * (which is exempt from rule 7 because *nothing* survives a root layout
 * crash), a mistyped URL is routine, not catastrophic, so this file still
 * owes the reader their language: it reads the `NEXT_LOCALE` cookie that
 * next-intl's own middleware already sets on every response and pulls the
 * `errors.notFound` strings straight from the same message files everything
 * else uses — one source of copy, just read without the provider.
 *
 * What is still lost: `ThemeProvider`'s dark/light toggle. Without its script
 * this page always renders the light tokens from `globals.css`, the same
 * limitation `error.md` documents for `global-error`.
 *
 * The cookie read is split into its own component behind `<Suspense>` for the
 * same reason as `debug/observability/page.tsx`: under Cache Components,
 * reading `cookies()` in the page body blocks the whole route and fails the
 * build.
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

const messagesByLocale = {
  fr: frMessages,
  en: enMessages,
} satisfies Record<Locale, typeof frMessages>;

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  // The real locale is resolved from the cookie inside the streamed
  // `<Suspense>` boundary below, so `lang` here can only be a best guess made
  // before that resolves. Defaulting it keeps the shell itself static.
  return (
    <html
      lang={defaultLocale}
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <main className="flex flex-1 items-center justify-center px-6 py-24">
          <Suspense fallback={null}>
            <NotFoundContent />
          </Suspense>
        </main>
      </body>
    </html>
  );
}

async function NotFoundContent() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = messagesByLocale[locale].errors.notFound;

  return (
    <EmptyState
      className="measure-narrow"
      icon={Compass}
      title={t.title}
      description={t.description}
      action={
        <Button asChild>
          <a href={getPathname({ href: "/courses", locale })}>{t.action}</a>
        </Button>
      }
    />
  );
}
