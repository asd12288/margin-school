import "server-only";

import { getTranslations } from "next-intl/server";

import type { AccountSlotLabels } from "@/components/margin/shell/account-slot";
import type { LocaleSwitcherLabels } from "@/components/margin/shell/locale-switcher";
import type { ThemeToggleLabels } from "@/components/margin/theme-toggle";

export interface ShellLabels {
  brand: string;
  skipToContent: string;
  /** Accessible name for the nav landmark, e.g. "Main". */
  navLabel: string;
  nav: {
    courses: string;
    learn: string;
    myCourses: string;
  };
  theme: ThemeToggleLabels;
  locale: LocaleSwitcherLabels;
  account: AccountSlotLabels;
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

  return {
    brand: t("shell.brand"),
    skipToContent: t("shell.skipToContent"),
    navLabel: t("shell.navLabel"),
    nav: {
      courses: t("shell.nav.courses"),
      learn: t("shell.nav.learn"),
      myCourses: t("shell.nav.myCourses"),
    },
    theme: {
      group: t("theme.group"),
      light: t("theme.light"),
      dark: t("theme.dark"),
      system: t("theme.system"),
    },
    locale: {
      group: t("shell.locale.group"),
      fr: t("shell.locale.fr"),
      en: t("shell.locale.en"),
    },
    account: {
      signIn: t("shell.account.signIn"),
      startTrial: t("shell.account.startTrial"),
      menu: t("shell.account.menu"),
      account: t("shell.nav.account"),
      myCourses: t("shell.nav.myCourses"),
      admin: t("shell.nav.admin"),
      signOut: t("shell.account.signOut"),
    },
  };
}
