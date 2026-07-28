"use client";

import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * The pieces every auth form is built from.
 *
 * No strings here either — the forms above pass them down, and the forms
 * themselves get them from the server. `components/margin/` stays free of
 * display text (docs/design-system.md), which for these is what lets a server
 * action return `"passwordTooShort"` and have it come out in the right
 * language.
 */

/* -------------------------------------------------------------------------
   Field
   ------------------------------------------------------------------------- */

function Field({
  id,
  name,
  label,
  error,
  hint,
  ...props
}: React.ComponentProps<"input"> & {
  id: string;
  name: string;
  label: string;
  /** Already translated by the caller. */
  error?: string;
  hint?: string;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        // `aria-invalid` drives the destructive ring in ui/input, so the
        // visual error state and the announced one can never disagree.
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error && errorId, hint && hintId) || undefined}
        className="h-9"
        {...props}
      />
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        /*
         * `role="alert"`, not a plain paragraph. A field error appears after
         * a submit the user has already made, so nothing else moves focus and
         * a screen reader would otherwise never mention it.
         */
        <p id={errorId} role="alert" className="text-xs text-destructive-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Form-level message
   ------------------------------------------------------------------------- */

/**
 * The whole-form outcome: "those credentials do not match", "check your
 * email".
 *
 * One component for both tones rather than two, because they occupy the same
 * slot and swapping between them should not move the layout.
 */
function FormMessage({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;

  return (
    <div
      /*
       * A stable hook for tests. `getByRole("alert")` cannot be used to find
       * this: Next renders its own `role="alert"` route announcer on every
       * page, so the role matches two elements and Playwright's strict mode
       * fails before it ever looks at the text.
       */
      data-slot="form-message"
      data-tone={tone}
      // Errors interrupt; a success notice waits its turn.
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm",
        "animate-panel-reveal",
        tone === "error"
          ? "border-destructive/25 bg-destructive-muted text-destructive-muted-foreground"
          : "border-success/25 bg-success-muted text-success-muted-foreground",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Submit
   ------------------------------------------------------------------------- */

/**
 * `useFormStatus` rather than `useActionState`'s `pending`, so this reads the
 * status of the form it is inside without every form having to thread the flag
 * down. That is also why it is a separate component: the hook only reports on
 * a `<form>` above it in the tree.
 *
 * The label stays put while pending and the spinner takes the leading slot.
 * Swapping the text for "Signing in…" moves the button's width mid-click,
 * which in French — 15–20% longer — is a visible jump.
 */
function SubmitButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  /** Announced, not shown. The visible label does not change. */
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      aria-label={pending ? pendingLabel : undefined}
      className={cn("w-full", className)}
    >
      {pending ? <Spinner className="size-4" /> : null}
      {label}
    </Button>
  );
}

export { Field, FormMessage, SubmitButton };
