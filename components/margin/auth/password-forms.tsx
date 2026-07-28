"use client";

import { useActionState } from "react";

import { Field, FormMessage, SubmitButton } from "@/components/margin/auth/form-parts";
import {
  messageFor,
  type ForgotPasswordFormLabels,
  type ResetPasswordFormLabels,
} from "@/components/margin/auth/labels";
import {
  requestPasswordResetAction,
  updatePasswordAction,
} from "@/lib/auth/actions";
import { EMPTY_FORM_STATE } from "@/lib/auth/validation";

/**
 * The two halves of the reset protocol: ask for a link, then use it.
 *
 * Together in one file because they are one flow and neither is meaningful
 * without the other.
 */

/**
 * Step one — send the email.
 *
 * On success the form is replaced by the notice rather than kept alongside
 * it. Leaving a submit button under "check your email" invites a second
 * request, which rate-limits the person out of the flow they are already in.
 *
 * The notice says the same thing whether or not the address has an account.
 * That is the point: any difference here turns this form into a way to test
 * whether someone is a member.
 */
function ForgotPasswordForm({ labels }: { labels: ForgotPasswordFormLabels }) {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    EMPTY_FORM_STATE,
  );

  const notice = messageFor(labels.notices, state.notice);
  if (notice) return <FormMessage tone="success">{notice}</FormMessage>;

  const error = messageFor(labels.errors, state.error);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      <Field
        id="email"
        name="email"
        type="email"
        label={labels.email}
        autoComplete="email"
        defaultValue={state.values?.email}
        error={messageFor(labels.errors, state.fieldErrors?.email)}
        autoFocus
      />

      <SubmitButton label={labels.submit} pendingLabel={labels.submitPending} />
    </form>
  );
}

/**
 * Step two — choose the new password.
 *
 * No token field: `/auth/confirm` already traded the emailed token for a
 * session, so the person reaching this form is signed in and the action
 * writes to whoever that is. An expired or reused link never gets a session,
 * which is why the action's failure case is "linkExpired" rather than
 * anything about the password.
 */
function ResetPasswordForm({ labels }: { labels: ResetPasswordFormLabels }) {
  const [state, formAction] = useActionState(updatePasswordAction, EMPTY_FORM_STATE);
  const error = messageFor(labels.errors, state.error);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      <Field
        id="password"
        name="password"
        type="password"
        label={labels.password}
        autoComplete="new-password"
        hint={labels.passwordHint}
        error={messageFor(labels.errors, state.fieldErrors?.password)}
        autoFocus
      />

      <Field
        id="passwordConfirm"
        name="passwordConfirm"
        type="password"
        label={labels.passwordConfirm}
        autoComplete="new-password"
        error={messageFor(labels.errors, state.fieldErrors?.passwordConfirm)}
      />

      <SubmitButton label={labels.submit} pendingLabel={labels.submitPending} />
    </form>
  );
}

export { ForgotPasswordForm, ResetPasswordForm };
