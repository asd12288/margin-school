"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";

import { ChoiceGroup, type Choice } from "@/components/margin/auth/choice-group";
import { Field, FormMessage, SubmitButton } from "@/components/margin/auth/form-parts";
import { messageFor, type FormFeedbackLabels } from "@/components/margin/auth/labels";
import { Button } from "@/components/ui/button";
import {
  changePasswordAction,
  deleteAccountAction,
  updateProfileAction,
} from "@/lib/auth/actions";
import { EMPTY_FORM_STATE } from "@/lib/auth/validation";

/**
 * The three account forms.
 *
 * Three separate `<form>`s, not one. Each maps to one server action with its
 * own validation and its own outcome, and merging them would mean a password
 * change that fails takes the name change down with it.
 */

/* -------------------------------------------------------------------------
   Profile
   ------------------------------------------------------------------------- */

export interface ProfileFormLabels extends FormFeedbackLabels {
  submit: string;
  submitPending: string;
  name: { label: string; placeholder: string };
  language: { legend: string; choices: Choice[] };
  level: { legend: string; choices: Choice[] };
  goal: { legend: string; choices: Choice[] };
}

/**
 * The same four answers as onboarding, editable.
 *
 * Deliberately the same questions rather than a reduced "settings" subset:
 * someone whose level has changed should be able to say so, and the whole
 * point of storing level and goal is that they drive what gets recommended.
 *
 * On success the action redirects (the language may have changed, which
 * changes this page's URL), so there is no success branch here.
 */
function ProfileForm({
  labels,
  defaults,
}: {
  labels: ProfileFormLabels;
  defaults: {
    displayName: string;
    locale: string;
    experienceLevel?: string;
    goal?: string;
  };
}) {
  const [state, formAction] = useActionState(updateProfileAction, EMPTY_FORM_STATE);
  const error = messageFor(labels.errors, state.error);

  return (
    <form action={formAction} className="flex flex-col gap-7">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      <Field
        id="account-displayName"
        name="displayName"
        label={labels.name.label}
        placeholder={labels.name.placeholder}
        autoComplete="given-name"
        maxLength={60}
        defaultValue={state.values?.displayName ?? defaults.displayName}
        error={messageFor(labels.errors, state.fieldErrors?.displayName)}
      />

      <ChoiceGroup
        name="locale"
        legend={labels.language.legend}
        choices={labels.language.choices}
        defaultValue={defaults.locale}
        columns={2}
        error={messageFor(labels.errors, state.fieldErrors?.locale)}
      />

      <ChoiceGroup
        name="experienceLevel"
        legend={labels.level.legend}
        choices={labels.level.choices}
        defaultValue={defaults.experienceLevel}
        error={messageFor(labels.errors, state.fieldErrors?.experienceLevel)}
      />

      <ChoiceGroup
        name="goal"
        legend={labels.goal.legend}
        choices={labels.goal.choices}
        defaultValue={defaults.goal}
        error={messageFor(labels.errors, state.fieldErrors?.goal)}
      />

      <SubmitButton
        label={labels.submit}
        pendingLabel={labels.submitPending}
        className="sm:w-auto sm:self-start"
      />
    </form>
  );
}

/* -------------------------------------------------------------------------
   Password
   ------------------------------------------------------------------------- */

export interface PasswordFormLabels extends FormFeedbackLabels {
  current: string;
  password: string;
  passwordConfirm: string;
  passwordHint: string;
  submit: string;
  submitPending: string;
}

/**
 * Changing a known password, which is why it asks for the current one — see
 * the action for why that check is ours rather than Supabase's.
 *
 * Like the other two, this redirects on success rather than returning a
 * notice. The reason is specific to this action and worth reading before
 * "simplifying" it back: see `changePasswordAction`.
 */
function PasswordForm({ labels }: { labels: PasswordFormLabels }) {
  const [state, formAction] = useActionState(changePasswordAction, EMPTY_FORM_STATE);

  const error = messageFor(labels.errors, state.error);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      {/*
       * Success arrives on the URL, not in action state: the action redirects
       * rather than returning, so that the rotated session cookies land before
       * this page renders again. See the note in `changePasswordAction`.
       *
       * `useSearchParams` needs its own boundary to stay statically
       * renderable, and it renders nothing in the ordinary case, so
       * `fallback={null}` costs nothing.
       */}
      <Suspense fallback={null}>
        <ChangedNotice label={labels.notices.passwordChanged} />
      </Suspense>

      <Field
        id="currentPassword"
        name="currentPassword"
        type="password"
        label={labels.current}
        autoComplete="current-password"
        error={messageFor(labels.errors, state.fieldErrors?.currentPassword)}
      />

      <Field
        id="account-password"
        name="password"
        type="password"
        label={labels.password}
        autoComplete="new-password"
        hint={labels.passwordHint}
        error={messageFor(labels.errors, state.fieldErrors?.password)}
      />

      <Field
        id="account-passwordConfirm"
        name="passwordConfirm"
        type="password"
        label={labels.passwordConfirm}
        autoComplete="new-password"
        error={messageFor(labels.errors, state.fieldErrors?.passwordConfirm)}
      />

      <SubmitButton
        label={labels.submit}
        pendingLabel={labels.submitPending}
        className="sm:w-auto sm:self-start"
      />
    </form>
  );
}

/**
 * The "your password has been changed" banner, shown when the action's
 * redirect brought us back with `?changed=password`.
 */
function ChangedNotice({ label }: { label: string }) {
  if (useSearchParams().get("changed") !== "password") return null;

  return <FormMessage tone="success">{label}</FormMessage>;
}

/* -------------------------------------------------------------------------
   Deletion
   ------------------------------------------------------------------------- */

export interface DeleteAccountFormLabels extends FormFeedbackLabels {
  /** The word to type. Translated — see the action. */
  confirmWord: string;
  confirmLabel: string;
  submit: string;
  submitPending: string;
}

/**
 * GDPR erasure.
 *
 * Typing the word is the whole confirmation, and it is deliberately more
 * friction than a dialog with a red button: this is irreversible and there is
 * no undo, no trash, and no support queue to undo it from.
 *
 * The expected word travels in a hidden field so the action compares against
 * the same translated string the person was shown — a server that hardcoded
 * "DELETE" would be asking a French user to type an English word.
 */
function DeleteAccountForm({ labels }: { labels: DeleteAccountFormLabels }) {
  const [state, formAction] = useActionState(deleteAccountAction, EMPTY_FORM_STATE);
  const error = messageFor(labels.errors, state.error);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      <input type="hidden" name="expected" value={labels.confirmWord} />

      <Field
        id="confirmation"
        name="confirmation"
        label={labels.confirmLabel}
        autoComplete="off"
        // A password manager offering to fill "SUPPRIMER" would be absurd,
        // and autocapitalize on a phone would fight the uppercase word.
        autoCorrect="off"
        spellCheck={false}
        error={messageFor(labels.errors, state.fieldErrors?.confirmation)}
      />

      <DeleteSubmit label={labels.submit} />
    </form>
  );
}

/**
 * Its own button rather than `SubmitButton`, because this is the one action in
 * the product that should not look like the primary action anywhere else.
 */
function DeleteSubmit({ label }: { label: string }) {
  return (
    <Button
      type="submit"
      variant="destructive"
      size="lg"
      className="w-full sm:w-auto sm:self-start"
    >
      {label}
    </Button>
  );
}

export { DeleteAccountForm, PasswordForm, ProfileForm };
