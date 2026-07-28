import "server-only";

import { getTranslations } from "next-intl/server";

import type { OnboardingFormLabels } from "@/components/margin/auth/onboarding-form";
import type { AuthPanelLabels } from "@/components/margin/auth/auth-layout";
import { routing } from "@/i18n/routing";
import { getFormFeedbackLabels } from "@/lib/auth/labels";
import { EXPERIENCE_LEVELS, LEARNING_GOALS } from "@/lib/auth/validation";

/**
 * Onboarding's strings, translated on the server.
 *
 * The choice lists are built by mapping the **Drizzle enum values** through
 * the translations, rather than by writing the options out here. That is what
 * makes adding a fifth goal a schema change plus two message keys, instead of
 * a schema change plus a list here that someone forgets — and it is why the
 * message keys are named after the enum values (`understand_markets`) rather
 * than being camel-cased into something prettier that would need a mapping
 * table to get back.
 */
export async function getOnboardingLabels(): Promise<OnboardingFormLabels> {
  const t = await getTranslations("onboarding");

  return {
    ...(await getFormFeedbackLabels()),
    submit: t("submit"),
    submitPending: t("submitPending"),
    name: {
      legend: t("name.legend"),
      label: t("name.label"),
      placeholder: t("name.placeholder"),
    },
    language: {
      legend: t("language.legend"),
      // The language names come from the shell's existing pair, so there is
      // one place that decides "Français" is spelled with a cedilla.
      choices: await localeChoices(),
    },
    /**
     * `icon` is the enum value itself, which `ChoiceGroup` resolves against
     * its own registry. It is a string rather than a component because a
     * component cannot be serialized across the server/client boundary.
     */
    level: {
      legend: t("level.legend"),
      choices: EXPERIENCE_LEVELS.map((value) => ({
        value,
        label: t(`level.${value}.label`),
        icon: value,
      })),
    },
    goal: {
      legend: t("goal.legend"),
      choices: LEARNING_GOALS.map((value) => ({
        value,
        label: t(`goal.${value}.label`),
        icon: value,
      })),
    },
  };
}

async function localeChoices() {
  const t = await getTranslations("shell.locale");

  /**
   * Each language is named **in itself** — "Français", not "French". Someone
   * who has landed in the wrong language needs to recognise their own, and a
   * French speaker reading an English page will not find "French" faster than
   * they find "Français". This is the same list the header's switcher uses.
   */
  return routing.locales.map((value) => ({ value, label: t(value) }));
}

/** The right-hand column, reworded for someone who has just signed up. */
export async function getOnboardingPanelLabels(): Promise<AuthPanelLabels> {
  const [t, shell] = await Promise.all([
    getTranslations("onboarding.panel"),
    getTranslations("shell"),
  ]);

  return {
    brand: shell("brand"),
    headline: t("headline"),
    points: [t("points.everything"), t("points.languages"), t("points.cancel")],
    disclaimer: shell("disclaimer"),
  };
}
