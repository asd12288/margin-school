"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";

import { FormMessage } from "@/components/margin/auth/form-parts";
import { messageFor, type FormFeedbackLabels, type GoogleButtonLabels } from "@/components/margin/auth/labels";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { signInWithGoogleAction } from "@/lib/auth/actions";
import { safeNextPath } from "@/lib/auth/routes";
import { EMPTY_FORM_STATE } from "@/lib/auth/validation";

/**
 * Google sign-in.
 *
 * Its own `<form>` because forms cannot nest, and it has to be a form rather
 * than a button with an `onClick`: the action redirects to Google, and only a
 * server action can set the PKCE verifier cookie that the callback will need
 * on the way back.
 *
 * Rendered only where `GOOGLE_SIGN_IN_ENABLED` says the provider is
 * configured — see lib/auth/providers.ts.
 */
function GoogleButton({
  labels,
}: {
  labels: GoogleButtonLabels & FormFeedbackLabels;
}) {
  const [state, formAction] = useActionState(signInWithGoogleAction, EMPTY_FORM_STATE);
  const error = messageFor(labels.errors, state.error);

  return (
    <div className="flex flex-col gap-4">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      <form action={formAction}>
        {/*
         * `next` is read from the URL here rather than passed down, for the
         * same reason as in `SignInForm`: reading it in the page would make
         * `/sign-in` uncached and fail the Cache Components build. The
         * boundary wraps something that renders nothing when there is no
         * `next`, which is the usual case.
         */}
        <Suspense fallback={null}>
          <NextField />
        </Suspense>
        <GoogleSubmit label={labels.google} />
      </form>

      {/*
       * The divider. `aria-hidden` on the rules and a real word between them,
       * so a screen reader hears "or" once instead of announcing two
       * separators around it.
       */}
      <div className="flex items-center gap-3">
        <span aria-hidden className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{labels.or}</span>
        <span aria-hidden className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

/** Mirrors `SignInForm`'s field of the same name. */
function NextField() {
  const next = safeNextPath(useSearchParams().get("next"));
  if (!next) return null;

  return <input type="hidden" name="next" value={next} />;
}

function GoogleSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      size="lg"
      disabled={pending}
      className="w-full"
    >
      {pending ? <Spinner className="size-4" /> : <GoogleMark />}
      {label}
    </Button>
  );
}

/**
 * Google's mark, inline.
 *
 * The one place in this codebase where raw hex is correct: these are Google's
 * brand colours, fixed by their guidelines, and they do not change with our
 * theme. Routing them through a semantic role would be a lie about what they
 * are — and the lint rule that bans arbitrary values covers Tailwind classes,
 * not SVG `fill` attributes, so nothing here is being worked around.
 */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.86c2.26-2.08 3.59-5.15 3.59-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3a7.2 7.2 0 0 1-10.74-3.78H1.34v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.33 14.31a7.09 7.09 0 0 1 0-4.62V6.6H1.34a12 12 0 0 0 0 10.8l3.99-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.34 6.6l3.99 3.09A7.15 7.15 0 0 1 12 4.75Z"
      />
    </svg>
  );
}

export { GoogleButton };
