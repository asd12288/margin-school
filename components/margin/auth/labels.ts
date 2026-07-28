/**
 * Label shapes for the auth forms.
 *
 * Types only, in their own module, because both the client forms and the
 * server-side builder in `lib/auth/labels.ts` need them — and importing the
 * builder from a client component would drag `server-only` across the
 * boundary.
 */

/**
 * Every message a server action can return, pre-translated and keyed by the
 * key the action returns.
 *
 * A record rather than a function, because these cross into client components
 * and a function cannot be serialized as a prop — the same constraint that
 * shaped `CurriculumLabels` (docs/design-system.md).
 */
export type MessageLabels = Record<string, string>;

/** Shared by every form here: what a failed or successful submit says. */
export interface FormFeedbackLabels {
  errors: MessageLabels;
  notices: MessageLabels;
}

export interface GoogleButtonLabels {
  google: string;
  or: string;
}

export interface SignInFormLabels extends FormFeedbackLabels, GoogleButtonLabels {
  email: string;
  password: string;
  submit: string;
  submitPending: string;
  forgotPassword: string;
}

export interface SignUpFormLabels extends FormFeedbackLabels, GoogleButtonLabels {
  email: string;
  password: string;
  passwordHint: string;
  submit: string;
  submitPending: string;
  /** Shown when the account exists but the address is unconfirmed. */
  continueToOnboarding: string;
}

export interface ForgotPasswordFormLabels extends FormFeedbackLabels {
  email: string;
  submit: string;
  submitPending: string;
}

export interface ResetPasswordFormLabels extends FormFeedbackLabels {
  password: string;
  passwordConfirm: string;
  passwordHint: string;
  submit: string;
  submitPending: string;
}

/**
 * Resolves a key returned by a server action to a sentence.
 *
 * Falls back to `unexpected` rather than rendering the raw key. A key that has
 * no translation is a bug on our side, and "unexpected" is a truthful thing to
 * say about it — `passwordTooShort` printed literally on a French form is not.
 */
export function messageFor(
  messages: MessageLabels,
  key: string | undefined,
): string | undefined {
  if (!key) return undefined;
  return messages[key] ?? messages.unexpected;
}
