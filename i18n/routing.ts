/**
 * Locale configuration.
 *
 * Launch locales are French and English, per docs/content-model.md. French is
 * the default: it is the first market, and defaulting to English would send
 * the majority of early visitors to a translation.
 *
 * **URL routing is not wired here yet.** docs/content-model.md rule 4 requires
 * `/fr/…` and `/en/…` with correct `hreflang`, and that lands with the app
 * shells in PRO-152 — `lib/auth/routes.ts` already says so, and the proxy that
 * would have to compose with next-intl's middleware belongs to that work.
 * Adding a `[locale]` segment now would collide with it.
 *
 * So this is next-intl in its documented no-routing mode: the message layer,
 * the formatters and the `useTranslations` API all work, components can stop
 * carrying English literals, and PRO-152 adds the segment without touching a
 * single message or component.
 */

export const locales = ["fr", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}
