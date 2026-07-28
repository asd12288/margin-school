"use client";

import { useActionState } from "react";

import { ChoiceGroup, type Choice } from "@/components/margin/auth/choice-group";
import { Field, FormMessage, SubmitButton } from "@/components/margin/auth/form-parts";
import { messageFor, type FormFeedbackLabels } from "@/components/margin/auth/labels";
import { completeOnboardingAction } from "@/lib/auth/actions";
import { EMPTY_FORM_STATE } from "@/lib/auth/validation";

export interface OnboardingFormLabels extends FormFeedbackLabels {
  submit: string;
  submitPending: string;
  name: { legend: string; label: string; placeholder: string };
  language: { legend: string; choices: Choice[] };
  level: { legend: string; choices: Choice[] };
  goal: { legend: string; choices: Choice[] };
}

/**
 * The four onboarding answers, on one screen.
 *
 * **One screen, not a wizard.** Four questions do not need a process wrapped
 * around them, and a step-by-step version would have been JavaScript-only —
 * which matters more here than anywhere else in the product, because
 * onboarding blocks (ADR-0012) and a door that needs JS to open is a door some
 * people cannot open at all. As written, this form submits natively.
 *
 * One submit, one write, one `onboarded_at`. See the action for why that
 * matters.
 */
function OnboardingForm({
  labels,
  defaults,
}: {
  labels: OnboardingFormLabels;
  /**
   * Prefilled where we already know something — a name from Google's profile,
   * the locale they are currently reading in. Asking a Google user to retype
   * the name Google just gave us reads as not paying attention.
   */
  defaults: { displayName?: string; locale: string };
}) {
  const [state, formAction] = useActionState(
    completeOnboardingAction,
    EMPTY_FORM_STATE,
  );

  const error = messageFor(labels.errors, state.error);

  return (
    <form action={formAction} className="flex flex-col gap-7">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      <Field
        id="displayName"
        name="displayName"
        label={labels.name.legend}
        placeholder={labels.name.placeholder}
        autoComplete="given-name"
        maxLength={60}
        defaultValue={state.values?.displayName ?? defaults.displayName}
        error={messageFor(labels.errors, state.fieldErrors?.displayName)}
        autoFocus
      />

      <ChoiceGroup
        name="locale"
        legend={labels.language.legend}
        choices={labels.language.choices}
        defaultValue={defaults.locale}
        columns={2}
        error={messageFor(labels.errors, state.fieldErrors?.locale)}
      />

      {/*
       * One column, like the goal group below it, though three short labels
       * look like they want a row. They do not: this column is 46ch wide, and
       * split three ways "Je connais les bases" broke onto three lines while
       * the English fitted on one — so the French reader, who is the default
       * here, got the cramped version. A single column also means the eye
       * runs down one list of icons instead of switching axis mid-form.
       */}
      <ChoiceGroup
        name="experienceLevel"
        legend={labels.level.legend}
        choices={labels.level.choices}
        error={messageFor(labels.errors, state.fieldErrors?.experienceLevel)}
      />

      <ChoiceGroup
        name="goal"
        legend={labels.goal.legend}
        choices={labels.goal.choices}
        error={messageFor(labels.errors, state.fieldErrors?.goal)}
      />

      <SubmitButton label={labels.submit} pendingLabel={labels.submitPending} />
    </form>
  );
}

export { OnboardingForm };
