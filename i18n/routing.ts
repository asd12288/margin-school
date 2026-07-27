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

/**
 * Path segments are translated per locale, not just prefixed.
 *
 * Udemy serves a French visitor `/fr/courses/finance-and-accounting/` and
 * ships those pages with no `hreflang` at all. That is a defensible choice for
 * an English-first global marketplace and a bad one for us: France is the
 * first market and SEO is the acquisition channel (docs/product.md).
 *
 * The literal translation does not survive French. English separates the list
 * from the thing by plural — `/courses` vs `/course/[course]` — and French
 * `cours` is invariable, so both would collapse onto `/cours/…` and a course
 * would be indistinguishable from a category. Hence `catalogue` for browsing
 * and `cours` for a course, which reads better in French than the English
 * does in English. tests/unit/routing.test.ts enforces that no two routes ever
 * collide in a locale again.
 *
 * Keys are canonical and English; they are what `Link href` takes. The file
 * tree matches the keys, never the translations.
 */
const pathnames = {
  "/": "/",

  // Public
  "/courses": { fr: "/catalogue", en: "/courses" },
  "/courses/[...category]": {
    fr: "/catalogue/[...category]",
    en: "/courses/[...category]",
  },
  "/course/[course]": { fr: "/cours/[course]", en: "/course/[course]" },

  // Auth
  "/sign-in": { fr: "/connexion", en: "/sign-in" },
  "/sign-up": { fr: "/inscription", en: "/sign-up" },

  // App
  "/learn": { fr: "/apprendre", en: "/learn" },
  "/my-courses": { fr: "/mes-cours", en: "/my-courses" },
  "/account": { fr: "/compte", en: "/account" },

  // Internal — untranslated on purpose. No SEO surface, and a content author
  // navigating admin is not helped by a translated URL.
  "/admin": "/admin",
  "/design-system": "/design-system",
  "/debug/observability": "/debug/observability",
} as const;

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "always",
  pathnames,
});

export const locales = routing.locales;
export type Locale = (typeof routing.locales)[number];
export const defaultLocale = routing.defaultLocale;

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}
