import "server-only";

import { getTranslations } from "next-intl/server";

import type { AuthPanelLabels } from "@/components/margin/auth/auth-layout";
import type {
  ForgotPasswordFormLabels,
  MessageLabels,
  ResetPasswordFormLabels,
  SignInFormLabels,
  SignUpFormLabels,
} from "@/components/margin/auth/labels";

/**
 * Translates every auth string on the server, so the client forms can stay
 * free of display text.
 *
 * Same shape and same reason as `lib/shell-labels.ts`: a server action returns
 * a key like `invalidCredentials`, and the form needs a sentence in the
 * reader's language without importing `next-intl` into a component that
 * `components/margin/` says holds no words.
 */

/**
 * Every key an action can return, listed once.
 *
 * Explicit rather than reflected off the messages file. next-intl throws on a
 * missing key, so a translation that was never written fails loudly here — at
 * the point of use — instead of the first time a user hits that error path in
 * production.
 */
const ERROR_KEYS = [
  // Field-level
  "emailRequired",
  "emailInvalid",
  "passwordRequired",
  "passwordTooShort",
  "passwordConfirmRequired",
  "passwordMismatch",
  "currentPasswordWrong",
  "displayNameRequired",
  "displayNameTooLong",
  "experienceLevelRequired",
  "goalRequired",
  "localeRequired",
  "confirmationMismatch",
  // Form-level
  "invalidCredentials",
  "emailNotConfirmed",
  "emailTaken",
  "samePassword",
  "signupDisabled",
  "tooManyRequests",
  "linkExpired",
  "linkInvalid",
  "oauthFailed",
  "unexpected",
] as const;

const NOTICE_KEYS = ["checkEmail", "checkEmailReset", "passwordChanged"] as const;

async function feedback(): Promise<{
  errors: MessageLabels;
  notices: MessageLabels;
}> {
  const [error, notice] = await Promise.all([
    getTranslations("auth.errors"),
    getTranslations("auth.notices"),
  ]);

  return {
    errors: Object.fromEntries(ERROR_KEYS.map((key) => [key, error(key)])),
    notices: Object.fromEntries(NOTICE_KEYS.map((key) => [key, notice(key)])),
  };
}

/** The decorative right-hand column. Facts only — see the component. */
export async function getAuthPanelLabels(): Promise<AuthPanelLabels> {
  const [t, shell] = await Promise.all([
    getTranslations("auth.panel"),
    getTranslations("shell"),
  ]);

  return {
    brand: shell("brand"),
    headline: t("headline"),
    points: [t("points.everything"), t("points.languages"), t("points.cancel")],
    // The same sentence the footer carries. One source, because a risk
    // disclaimer that is worded two ways is two disclaimers to keep correct.
    disclaimer: shell("disclaimer"),
  };
}

export async function getSignInLabels(): Promise<SignInFormLabels> {
  const [t, shared] = await Promise.all([
    getTranslations("auth.signIn"),
    getTranslations("auth.shared"),
  ]);

  return {
    ...(await feedback()),
    email: shared("email"),
    password: shared("password"),
    submit: t("submit"),
    submitPending: t("submitPending"),
    forgotPassword: t("forgotPassword"),
    google: shared("google"),
    or: shared("or"),
  };
}

export async function getSignUpLabels(): Promise<SignUpFormLabels> {
  const [t, shared] = await Promise.all([
    getTranslations("auth.signUp"),
    getTranslations("auth.shared"),
  ]);

  return {
    ...(await feedback()),
    email: shared("email"),
    password: shared("password"),
    passwordHint: shared("passwordHint"),
    submit: t("submit"),
    submitPending: t("submitPending"),
    continueToOnboarding: t("continueToOnboarding"),
    google: shared("google"),
    or: shared("or"),
  };
}

export async function getForgotPasswordLabels(): Promise<ForgotPasswordFormLabels> {
  const [t, shared] = await Promise.all([
    getTranslations("auth.forgotPassword"),
    getTranslations("auth.shared"),
  ]);

  return {
    ...(await feedback()),
    email: shared("email"),
    submit: t("submit"),
    submitPending: t("submitPending"),
  };
}

export async function getResetPasswordLabels(): Promise<ResetPasswordFormLabels> {
  const [t, shared] = await Promise.all([
    getTranslations("auth.resetPassword"),
    getTranslations("auth.shared"),
  ]);

  return {
    ...(await feedback()),
    password: shared("newPassword"),
    passwordConfirm: shared("confirmPassword"),
    passwordHint: shared("passwordHint"),
    submit: t("submit"),
    submitPending: t("submitPending"),
  };
}

/** Exposed so the account page can reuse the same error vocabulary. */
export { feedback as getFormFeedbackLabels };
