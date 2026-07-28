import { experienceLevel, learningGoal, userLocale } from "@/lib/db/schema";

/**
 * Form validation for the auth and onboarding flows.
 *
 * **Validators return translation keys, never sentences.** AGENTS.md rule 7
 * makes every user-facing string translatable, and a server action is the one
 * place where that is easy to get wrong: the message would be composed on the
 * server, where the request locale is known, and then be stuck in that
 * language inside a client component's state. So the server decides *what*
 * went wrong and the client decides *how to say it* — keys here, `useTranslations`
 * there.
 *
 * Hand-written rather than zod. The rules below are eight lines of string
 * checks; the dependency would be larger than the thing it replaces, and
 * docs/stack.md's bias is explicitly toward fewer vendors.
 */

/** Keys under `auth.errors` in messages/{fr,en}.json. */
export type ErrorKey = string;

export interface FormState {
  /** A failure that belongs to the form as a whole, not to one input. */
  error?: ErrorKey;
  /** Per-input failures, keyed by the input's `name`. */
  fieldErrors?: Record<string, ErrorKey>;
  /** A success that stays on the page instead of redirecting. Key under `auth.notices`. */
  notice?: ErrorKey;
  /**
   * What the user typed, echoed back.
   *
   * A server action re-renders the form from scratch, so without this a failed
   * submit empties every field and the user retypes their email to find out
   * they mistyped their password. Passwords are deliberately never echoed.
   */
  values?: Record<string, string>;
}

export const EMPTY_FORM_STATE: FormState = {};

/**
 * Sign-up's state, which carries one extra thing.
 *
 * Only that action returns a destination instead of redirecting, because it
 * has an analytics event to fire from the browser first — see the action and
 * `SignUpForm`. Kept as its own type rather than added to `FormState`, so the
 * other seven forms cannot quietly acquire a field none of them sets and the
 * exception stays visible.
 */
export type SignUpFormState = FormState & { redirectTo?: string };

/**
 * Minimum password length.
 *
 * Eight, not Supabase's default of six, and matched in `supabase/config.toml`
 * so the database agrees with the form — a rule enforced in only one of the
 * two is a rule that fails somewhere confusing. No composition requirements
 * (an uppercase, a digit, a symbol): current NIST guidance is that length
 * beats character classes, which mostly drive people toward `Password1!`.
 */
export const MIN_PASSWORD_LENGTH = 8;

/** Guards against someone pasting a novel into a text input. */
export const MAX_DISPLAY_NAME_LENGTH = 60;

/**
 * Deliberately permissive: something, an `@`, something with a dot.
 *
 * A stricter regex rejects addresses that are actually valid far more often
 * than it catches typos, and the real proof of an address is that a message
 * sent to it arrives. This only exists to catch the obviously-not-an-email
 * case before it costs a round trip.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reads a form field as a trimmed string. `FormData` values may be `File`. */
export function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Reads a password without trimming.
 *
 * Leading and trailing spaces are legitimate password characters, and
 * trimming them here would silently sign someone up with one password and
 * then refuse the one they typed on the way back in.
 */
export function passwordField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function validateEmail(value: string): ErrorKey | null {
  if (!value) return "emailRequired";
  if (!EMAIL_PATTERN.test(value)) return "emailInvalid";
  return null;
}

export function validatePassword(value: string): ErrorKey | null {
  if (!value) return "passwordRequired";
  if (value.length < MIN_PASSWORD_LENGTH) return "passwordTooShort";
  return null;
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): ErrorKey | null {
  if (!confirmation) return "passwordConfirmRequired";
  if (password !== confirmation) return "passwordMismatch";
  return null;
}

export function validateDisplayName(value: string): ErrorKey | null {
  if (!value) return "displayNameRequired";
  if (value.length > MAX_DISPLAY_NAME_LENGTH) return "displayNameTooLong";
  return null;
}

/* -------------------------------------------------------------------------
   Enum fields
   -------------------------------------------------------------------------
   Validated against the Drizzle enum's own values rather than a second list
   written out here. A hand-copied list is a list that drifts: adding a
   fourth goal to the schema would leave the form silently rejecting it.
   ------------------------------------------------------------------------- */

export type ExperienceLevel = (typeof experienceLevel.enumValues)[number];
export type LearningGoal = (typeof learningGoal.enumValues)[number];
export type UserLocale = (typeof userLocale.enumValues)[number];

export const EXPERIENCE_LEVELS = experienceLevel.enumValues;
export const LEARNING_GOALS = learningGoal.enumValues;
export const USER_LOCALES = userLocale.enumValues;

export function parseExperienceLevel(value: string): ExperienceLevel | null {
  return EXPERIENCE_LEVELS.includes(value as ExperienceLevel)
    ? (value as ExperienceLevel)
    : null;
}

export function parseLearningGoal(value: string): LearningGoal | null {
  return LEARNING_GOALS.includes(value as LearningGoal)
    ? (value as LearningGoal)
    : null;
}

export function parseUserLocale(value: string): UserLocale | null {
  return USER_LOCALES.includes(value as UserLocale) ? (value as UserLocale) : null;
}

/** Drops the `null`s, so a caller can build `fieldErrors` in one expression. */
export function collectErrors(
  entries: Record<string, ErrorKey | null>,
): Record<string, ErrorKey> | null {
  const errors = Object.fromEntries(
    Object.entries(entries).filter(([, value]) => value !== null),
  ) as Record<string, ErrorKey>;

  return Object.keys(errors).length > 0 ? errors : null;
}
