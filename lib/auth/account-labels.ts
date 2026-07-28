import "server-only";

import { getTranslations } from "next-intl/server";

import type {
  DeleteAccountFormLabels,
  PasswordFormLabels,
  ProfileFormLabels,
} from "@/components/margin/auth/account-forms";
import { getFormFeedbackLabels } from "@/lib/auth/labels";
import { getOnboardingLabels } from "@/lib/auth/onboarding-labels";

/**
 * The account page's strings.
 *
 * The profile form's choice lists are lifted straight off onboarding's, since
 * they are literally the same four questions. Rebuilding them here would give
 * the product two places where "I already invest" is worded, and they would
 * eventually disagree.
 */
export async function getProfileFormLabels(): Promise<ProfileFormLabels> {
  const [t, onboarding] = await Promise.all([
    getTranslations("account.profile"),
    getOnboardingLabels(),
  ]);

  return {
    errors: onboarding.errors,
    notices: onboarding.notices,
    submit: t("submit"),
    submitPending: t("submitPending"),
    name: {
      label: onboarding.name.label,
      placeholder: onboarding.name.placeholder,
    },
    // Legends only, without onboarding's `help` lines: the explanations are
    // for someone answering for the first time, and repeating "there is no
    // wrong answer" to someone editing their own settings is noise.
    language: {
      legend: onboarding.language.legend,
      choices: onboarding.language.choices,
    },
    level: { legend: onboarding.level.legend, choices: onboarding.level.choices },
    goal: { legend: onboarding.goal.legend, choices: onboarding.goal.choices },
  };
}

export async function getPasswordFormLabels(): Promise<PasswordFormLabels> {
  const [t, shared] = await Promise.all([
    getTranslations("account.password"),
    getTranslations("auth.shared"),
  ]);

  return {
    ...(await getFormFeedbackLabels()),
    current: t("current"),
    password: shared("newPassword"),
    passwordConfirm: shared("confirmPassword"),
    passwordHint: shared("passwordHint"),
    submit: t("submit"),
    submitPending: t("submitPending"),
  };
}

export async function getDeleteAccountLabels(): Promise<DeleteAccountFormLabels> {
  const t = await getTranslations("account.danger");
  const confirmWord = t("confirmWord");

  return {
    ...(await getFormFeedbackLabels()),
    confirmWord,
    // Interpolated here rather than in the component, so the sentence can put
    // the word wherever its grammar wants it.
    confirmLabel: t("confirmLabel", { word: confirmWord }),
    submit: t("submit"),
    submitPending: t("submitPending"),
  };
}
