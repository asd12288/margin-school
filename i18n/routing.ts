import { defineRouting } from "next-intl/routing";

/**
 * Locale routing.
 *
 * Launch locales are French and English. French is the default: it is the
 * first market, and defaulting to English would send the majority of early
 * visitors to a translation.
 *
 * `localePrefix: "always"` puts the locale in every URL, including the
 * default — `/fr/…` and `/en/…`, never a bare `/…`. docs/content-model.md
 * rule 4 requires it: SEO is the acquisition channel, so each language needs
 * its own indexable URL with correct `hreflang`, and cookie-based switching
 * would give Google one URL for two languages.
 *
 * It also buys back static rendering. Without a `[locale]` segment next-intl
 * cannot use `setRequestLocale` and reads headers on every render, which had
 * pushed every page from prerendered to dynamic and broke Tier 1 in
 * docs/ux-architecture.md.
 */
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "always",
});

export const locales = routing.locales;
export type Locale = (typeof routing.locales)[number];
export const defaultLocale = routing.defaultLocale;

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}
