"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { Field, FormMessage, SubmitButton } from "@/components/margin/auth/form-parts";
import { messageFor, type SignUpFormLabels } from "@/components/margin/auth/labels";
import { signUpAction } from "@/lib/auth/actions";
import { capture } from "@/lib/analytics/posthog";
import { EMPTY_FORM_STATE, type SignUpFormState } from "@/lib/auth/validation";

/**
 * Creating an account.
 *
 * The one form that navigates from the client. `signup_completed` opens the
 * north-star funnel (docs/observability.md) and `capture()` only runs in the
 * browser — PostHog is not loaded before consent, so there is no server-side
 * equivalent to call. A server redirect would unmount this component before
 * the event left, so the action hands back a destination instead and the hop
 * happens here, after the event.
 *
 * With email confirmation on there is no destination at all: the account
 * exists but the session does not, and the form shows the "check your email"
 * notice instead. The event still fires — the sign-up *did* complete.
 */
function SignUpForm({ labels }: { labels: SignUpFormLabels }) {
  // Typed explicitly: the initial state is a bare `FormState`, so inference
  // would drop `redirectTo` — the one field this form exists to read.
  const [state, formAction] = useActionState<SignUpFormState, FormData>(
    signUpAction,
    EMPTY_FORM_STATE,
  );
  const router = useRouter();

  /**
   * `useActionState` keeps returning the same state across re-renders, so
   * without this the effect would re-fire the event on every one. A ref rather
   * than state because nothing renders differently once it flips.
   */
  const reported = useRef(false);

  useEffect(() => {
    const succeeded = Boolean(state.redirectTo) || state.notice === "checkEmail";
    if (!succeeded || reported.current) return;

    reported.current = true;
    // No properties: an email address is personal data and observability.md
    // rule 2 keeps it out of event payloads. Who signed up is `identify`'s
    // job, on the next page.
    capture("signup_completed");

    // `replace`, not `push`: the sign-up form should not be a back-button
    // destination once the account exists.
    if (state.redirectTo) router.replace(state.redirectTo);
  }, [state.redirectTo, state.notice, router]);

  const error = messageFor(labels.errors, state.error);
  const notice = messageFor(labels.notices, state.notice);

  if (notice) {
    return <FormMessage tone="success">{notice}</FormMessage>;
  }

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

      <Field
        id="password"
        name="password"
        type="password"
        label={labels.password}
        // `new-password` so password managers offer to generate one rather
        // than autofilling the existing credential for this site.
        autoComplete="new-password"
        hint={labels.passwordHint}
        error={messageFor(labels.errors, state.fieldErrors?.password)}
      />

      <SubmitButton label={labels.submit} pendingLabel={labels.submitPending} />
    </form>
  );
}

export { SignUpForm };
