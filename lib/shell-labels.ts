import "server-only";

import { getLocale, getTranslations } from "next-intl/server";

import type { AccountSlotLabels } from "@/components/margin/shell/account-slot";
import type { LocaleSwitcherLabels } from "@/components/margin/shell/locale-switcher";
import type { SearchFieldLabels } from "@/components/margin/shell/search-field";
import type { SiteFooterLabels } from "@/components/margin/shell/site-footer";
import type { ThemeSwitchLabels } from "@/components/margin/shell/theme-switch";
import type { Locale } from "@/i18n/routing";

/**
 * Computed once, at module load, not inside `getShellLabels()`.
 *
 * Under `cacheComponents: true`, calling `new Date()` inside a Server
 * Component's render path is a build error ("prerender-current-time"):
 * reading the clock is treated as request data, exactly like `cookies()`,
 * and every consumer of this shared helper — including the admin and app
 * shells, which must stay static — would be forced dynamic by it. Reading
 * the year once at import time avoids the render path entirely; the trade-off
 * is that the footer's copyright year only advances on a redeploy, which is
 * the same trade-off every static build makes.
 */
const currentYear = new Date().getFullYear();

export interface ShellLabels {
  brand: string;
  skipToContent: string;
  /** Accessible name for the nav landmark, e.g. "Main". */
  navLabel: string;
  nav: {
    courses: string;
    concepts: string;
    pricing: string;
    learn: string;
    myCourses: string;
  };
  theme: ThemeSwitchLabels;
  locale: LocaleSwitcherLabels;
  search: SearchFieldLabels;
  account: AccountSlotLabels;
  footer: SiteFooterLabels;
}

/**
 * Every shell's words, in one place.
 *
 * Note `getTranslations()` takes no namespace and every key is written in
 * full: `theme.*` already lives at the top level of the messages file from
 * Phase 2, so a `getTranslations("shell")` scope could not reach it.
 *
 * This is a server-only helper by design — `next-intl`'s server API cannot
 * cross into a client component, and the shells' label objects are built where
 * the formatting happens (design-system.md:183).
 */
export async function getShellLabels(): Promise<ShellLabels> {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const localeNames = { fr: t("shell.locale.fr"), en: t("shell.locale.en") };
  const localeLabels: LocaleSwitcherLabels = {
    current: t("shell.locale.current", { locale: localeNames[locale] }),
    fr: localeNames.fr,
    en: localeNames.en,
  };

  return {
    brand: t("shell.brand"),
    skipToContent: t("shell.skipToContent"),
    navLabel: t("shell.navLabel"),
    nav: {
      courses: t("shell.nav.courses"),
      concepts: t("shell.nav.concepts"),
      pricing: t("shell.nav.pricing"),
      learn: t("shell.nav.learn"),
      myCourses: t("shell.nav.myCourses"),
    },
    // Phrased as the action the click performs, not the state it is in —
    // "Switch to dark theme", not "Dark". A toggle whose name describes its
    // current state leaves a screen-reader user guessing which way it goes.
    theme: {
      toDark: t("theme.toDark"),
      toLight: t("theme.toLight"),
    },
    locale: localeLabels,
    search: {
      label: t("shell.search.label"),
      placeholder: t("shell.search.placeholder"),
    },
    account: {
      startTrial: t("shell.account.startTrial"),
      menu: t("shell.account.menu"),
      account: t("shell.nav.account"),
      myCourses: t("shell.nav.myCourses"),
      admin: t("shell.nav.admin"),
      signOut: t("shell.account.signOut"),
    },
    footer: {
      brand: t("shell.brand"),
      tagline: t("shell.footer.tagline"),
      disclaimer: t("shell.disclaimer"),
      columns: {
        // Link text reuses the nav keys rather than declaring footer-only
        // copies: "Courses" naming two different things in the same document
        // is how a translation drifts.
        learn: {
          heading: t("shell.footer.learnHeading"),
          courses: t("shell.nav.courses"),
          concepts: t("shell.nav.concepts"),
        },
        company: {
          heading: t("shell.footer.companyHeading"),
          about: t("shell.nav.about"),
          pricing: t("shell.nav.pricing"),
          help: t("shell.nav.help"),
        },
        legal: {
          heading: t("shell.footer.legalHeading"),
          terms: t("legal.terms.title"),
          privacy: t("legal.privacy.title"),
          mentions: t("legal.mentions.title"),
          accessibility: t("legal.accessibility.title"),
        },
      },
      copyright: t("shell.footer.copyright", { year: currentYear }),
      cookiePreferences: t("shell.footer.cookiePreferences"),
      locale: localeLabels,
    },
  };
}
