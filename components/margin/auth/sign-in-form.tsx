"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";

import { Field, FormMessage, SubmitButton } from "@/components/margin/auth/form-parts";
import { messageFor, type SignInFormLabels } from "@/components/margin/auth/labels";
import { Link } from "@/i18n/navigation";
import { signInAction } from "@/lib/auth/actions";
import { safeNextPath } from "@/lib/auth/routes";
import { EMPTY_FORM_STATE } from "@/lib/auth/validation";

/**
 * Email and password.
 *
 * The action redirects on success, so there is no success branch here: this
 * component only ever renders the form, or the form plus a failure.
 *
 * **The URL is read on the client, not by the page.** `/sign-in` carries two
 * query parameters — `next`, set by the proxy when it bounces someone, and
 * `error`, set by the two route handlers after a failed OAuth or an expired
 * link. Awaiting `searchParams` in the page body made the whole route
 * uncached, and under Cache Components that fails the build outright
 * ("Uncached data was accessed outside of `<Suspense>`"). Wrapping the form in
 * a boundary instead would have fixed the build by putting a skeleton where
 * the primary action goes.
 *
 * Reading them here keeps `/sign-in` prerendered, which is what
 * docs/ux-architecture.md's route table says it is. `useSearchParams` still
 * needs its own `<Suspense>` to be statically rendered, but it wraps a
 * component that renders nothing in the common case — no error, no `next` —
 * so `fallback={null}` costs nothing and shifts nothing.
 */
function SignInForm({ labels }: { labels: SignInFormLabels }) {
  const [state, formAction] = useActionState(signInAction, EMPTY_FORM_STATE);
  const error = messageFor(labels.errors, state.error);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/*
       * A failure from the submit outranks one carried in from the URL: it is
       * the fresher fact, and it is about what the person just did.
       */}
      {error ? (
        <FormMessage tone="error">{error}</FormMessage>
      ) : (
        <Suspense fallback={null}>
          <UrlError labels={labels} />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <NextField />
      </Suspense>

      <Field
        id="email"
        name="email"
        type="email"
        label={labels.email}
        autoComplete="email"
        // Not `required`. The browser's own bubble is untranslated and
        // unstyled, and it fires before the action that would have said the
        // same thing in the right language. Validation lives on the server.
        defaultValue={state.values?.email}
        error={messageFor(labels.errors, state.fieldErrors?.email)}
        autoFocus
      />

      <div className="flex flex-col gap-1.5">
        <Field
          id="password"
          name="password"
          type="password"
          label={labels.password}
          autoComplete="current-password"
          error={messageFor(labels.errors, state.fieldErrors?.password)}
        />
        <Link
          href="/forgot-password"
          className="self-start text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {labels.forgotPassword}
        </Link>
      </div>

      <SubmitButton label={labels.submit} pendingLabel={labels.submitPending} />
    </form>
  );
}

/**
 * The failure a route handler wrote onto the URL two redirects ago.
 *
 * Looked up directly rather than through `messageFor`, whose job is to fall
 * back to "something went wrong" for a key we forgot to translate. Here an
 * unknown key means someone typed one, and the right response is to render
 * nothing at all — which is also what stops `?error=` putting arbitrary text
 * on the page.
 */
function UrlError({ labels }: { labels: SignInFormLabels }) {
  const key = useSearchParams().get("error");
  const message = key ? labels.errors[key] : undefined;

  if (!message) return null;

  return <FormMessage tone="error">{message}</FormMessage>;
}

/** Where the visitor was heading before the proxy bounced them here. */
function NextField() {
  const next = safeNextPath(useSearchParams().get("next"));
  if (!next) return null;

  return <input type="hidden" name="next" value={next} />;
}

export { SignInForm };
