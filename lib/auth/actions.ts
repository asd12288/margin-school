"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { getPathname } from "@/i18n/navigation";
import { routing, type Locale, type StaticPathname } from "@/i18n/routing";
import {
  getCurrentProfile,
  getCurrentUser,
  requireProfile,
  requireUser,
} from "@/lib/auth/dal";
import {
  AFTER_SIGN_IN_PATH,
  AUTH_CALLBACK_PATH,
  AUTH_CONFIRM_PATH,
  ONBOARDING_PATH,
  RESET_PASSWORD_PATH,
  safeNextPath,
} from "@/lib/auth/routes";
import { absoluteUrl } from "@/lib/auth/site-url";
import {
  createSupabaseAdminClient,
  createSupabaseCheckClient,
} from "@/lib/auth/supabase-admin";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import {
  collectErrors,
  field,
  parseExperienceLevel,
  parseLearningGoal,
  parseUserLocale,
  passwordField,
  validateDisplayName,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  type FormState,
  type SignUpFormState,
} from "@/lib/auth/validation";
import { db } from "@/lib/db/client";
import { profile } from "@/lib/db/schema";

/**
 * Every write in the auth and onboarding flows.
 *
 * Three rules hold across all of them.
 *
 * **Actions re-authorize.** Being rendered on a gated page proves nothing: a
 * server action is a public HTTP endpoint that anyone can call directly with
 * the right id. So each action that touches a profile calls `requireProfile()`
 * itself and writes to `profile.id = <the caller>`, never to an id arriving
 * in the form.
 *
 * **Failures return translation keys**, never sentences — see
 * lib/auth/validation.ts for why.
 *
 * **`redirect()` is called outside `try`.** It works by throwing, so a
 * `catch` around it swallows the redirect and the user sits on a form that
 * silently did nothing. Next's own docs call this out and it is the single
 * easiest mistake to make in this file.
 */

/* -------------------------------------------------------------------------
   Supabase error → translation key
   ------------------------------------------------------------------------- */

/**
 * Maps Supabase's error codes onto our own message keys.
 *
 * Keyed on `error.code`, not on `error.message`. The messages are English
 * prose owned by Supabase and they change without notice; the codes are a
 * documented enum (`@supabase/auth-js`'s `ErrorCode`). Matching on prose is
 * how a product ends up showing a raw "Invalid login credentials" in French.
 *
 * Anything unrecognised falls through to `unexpected`, which is deliberately
 * vague in the UI — an auth error is not the place to narrate internals.
 */
const ERROR_KEY_BY_CODE: Record<string, string> = {
  invalid_credentials: "invalidCredentials",
  email_not_confirmed: "emailNotConfirmed",
  user_already_exists: "emailTaken",
  email_exists: "emailTaken",
  weak_password: "passwordTooShort",
  same_password: "samePassword",
  signup_disabled: "signupDisabled",
  email_provider_disabled: "signupDisabled",
  user_banned: "invalidCredentials",
  over_request_rate_limit: "tooManyRequests",
  over_email_send_rate_limit: "tooManyRequests",
  otp_expired: "linkExpired",
  flow_state_expired: "linkExpired",
  flow_state_not_found: "linkExpired",
  bad_code_verifier: "linkExpired",
  validation_failed: "emailInvalid",
  email_address_invalid: "emailInvalid",
};

function errorKey(error: { code?: string } | null): string {
  return (error?.code && ERROR_KEY_BY_CODE[error.code]) || "unexpected";
}

/* -------------------------------------------------------------------------
   Locale helpers
   ------------------------------------------------------------------------- */

async function currentLocale(): Promise<Locale> {
  const locale = await getLocale();
  return routing.locales.includes(locale as Locale)
    ? (locale as Locale)
    : routing.defaultLocale;
}

/**
 * The localized URL for a canonical route — `/account` → `/fr/compte`.
 *
 * Typed against the route map rather than `string`: `getPathname` resolves
 * only keys it knows, and an unregistered path would silently come back
 * unprefixed and un-translated.
 *
 * The redirects below then use Next's own `redirect` on the resolved string,
 * not next-intl's, because several destinations are computed at runtime (the
 * `next=` parameter, Google's URL) and next-intl's variant only accepts
 * literal route keys.
 */
async function localizedPath(href: StaticPathname): Promise<string> {
  return getPathname({ href, locale: await currentLocale() });
}

/**
 * The absolute `/auth/confirm` URL an emailed link should come back to,
 * carrying where to go once the token is spent.
 *
 * **This, not `{{ .SiteURL }}`, is what decides the origin of an auth email's
 * link**, and the difference is not cosmetic. `SiteURL` is one value
 * configured on the Supabase project, so every environment sharing that
 * project gets the same one. Preview deployments share production's
 * (ADR-0010), so a password reset requested from a preview would have mailed a
 * link to *production* — and locally it pinned every link to port 3000, which
 * is how the e2e suite on 3100 first caught this.
 *
 * `absoluteUrl` reads the host off the request instead, so the link returns to
 * whichever deployment actually sent it. The templates interpolate this as
 * `{{ .RedirectTo }}` and append the token, which is why they append with `&`
 * — this URL already carries a query string.
 */
async function confirmUrl(next: string): Promise<string> {
  const url = new URL(await absoluteUrl(AUTH_CONFIRM_PATH));
  url.searchParams.set("next", next);

  return url.toString();
}

/* -------------------------------------------------------------------------
   Sign up
   ------------------------------------------------------------------------- */

/**
 * Unlike every other action here, this one does **not** redirect on success.
 *
 * `signup_completed` is the first event of the north-star funnel
 * (docs/observability.md) and `capture()` is client-side by design, because
 * PostHog must not load before consent. A server redirect unmounts the form
 * before it can fire anything, so the destination comes back as data and the
 * form navigates once the event is away.
 *
 * The cost is that sign-up alone needs JavaScript to complete the hop. The
 * account is created either way — a no-JS submit still lands on the success
 * notice, with the link to continue.
 */
export async function signUpAction(
  _previous: SignUpFormState,
  formData: FormData,
): Promise<SignUpFormState> {
  const email = field(formData, "email");
  const password = passwordField(formData, "password");

  const fieldErrors = collectErrors({
    email: validateEmail(email),
    password: validatePassword(password),
  });

  if (fieldErrors) return { fieldErrors, values: { email } };

  const supabase = await createSupabaseServerClient();
  const locale = await currentLocale();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Where the confirmation email lands: our own /auth/confirm, carrying
      // the localized destination. Localized because the email is the one
      // part of the flow that leaves the browser and comes back with no
      // memory of what language the person was reading.
      emailRedirectTo: await confirmUrl(
        getPathname({ href: ONBOARDING_PATH, locale }),
      ),
    },
  });

  if (error) return { error: errorKey(error), values: { email } };

  /**
   * With email confirmation on, Supabase returns a user and **no session**,
   * and — deliberately — returns the same shape for an address that already
   * has an account, so this response cannot be used to enumerate registered
   * emails. Both cases therefore get the identical "check your email" notice,
   * which is the correct behaviour rather than a limitation.
   */
  if (!data.session) return { notice: "checkEmail" };

  return { redirectTo: await localizedPath(ONBOARDING_PATH) };
}

/* -------------------------------------------------------------------------
   Sign in
   ------------------------------------------------------------------------- */

export async function signInAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = field(formData, "email");
  const password = passwordField(formData, "password");
  const next = safeNextPath(field(formData, "next"));

  const fieldErrors = collectErrors({
    email: validateEmail(email),
    password: validatePassword(password),
  });

  if (fieldErrors) return { fieldErrors, values: { email } };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    /**
     * One message for "no such account" and for "wrong password", because
     * Supabase returns one code (`invalid_credentials`) for both. That is
     * the behaviour we want anyway: distinguishing them turns the sign-in
     * form into an oracle for which email addresses have accounts here.
     */
    return { error: errorKey(error), values: { email } };
  }

  // Onboarding is blocking, so someone who abandoned it halfway resumes
  // there instead of at whatever they were originally trying to reach.
  const current = await getCurrentProfile();
  const destination =
    current && !current.onboardedAt
      ? await localizedPath(ONBOARDING_PATH)
      : (next ?? (await localizedPath(AFTER_SIGN_IN_PATH)));

  redirect(destination);
}

/* -------------------------------------------------------------------------
   Google
   ------------------------------------------------------------------------- */

/**
 * Starts the OAuth hop. Supabase returns the URL to send the browser to; it
 * does not perform the redirect itself.
 *
 * The `next` parameter rides along on the callback URL rather than in a
 * cookie, because the round trip goes through two other origins (Supabase,
 * then Google) and only the URL survives it intact.
 */
export async function signInWithGoogleAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const next = safeNextPath(field(formData, "next"));

  const callback = new URL(await absoluteUrl(AUTH_CALLBACK_PATH));
  callback.searchParams.set("locale", await currentLocale());
  if (next) callback.searchParams.set("next", next);

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });

  if (error || !data.url) return { error: errorKey(error) };

  redirect(data.url);
}

/* -------------------------------------------------------------------------
   Sign out
   ------------------------------------------------------------------------- */

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();

  /**
   * `scope: "local"` ends this browser's session only.
   *
   * The default, `global`, revokes every refresh token the user has, which
   * signs them out of their phone because they signed out on their laptop.
   * That is a reasonable thing to offer explicitly and a bad thing to do by
   * surprise from a menu item labelled "Sign out".
   */
  await supabase.auth.signOut({ scope: "local" });

  redirect(await localizedPath("/"));
}

/* -------------------------------------------------------------------------
   Forgotten password
   ------------------------------------------------------------------------- */

export async function requestPasswordResetAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = field(formData, "email");

  const fieldErrors = collectErrors({ email: validateEmail(email) });
  if (fieldErrors) return { fieldErrors, values: { email } };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await confirmUrl(await localizedPath(RESET_PASSWORD_PATH)),
  });

  /**
   * Rate limiting is the one failure worth reporting, and only because a
   * silent "check your email" would leave someone waiting for a message that
   * was never sent.
   *
   * Every other error resolves to the same success notice as a real send. An
   * unknown address must be indistinguishable from a known one here, or this
   * form becomes a way to test whether someone has an account — the exact
   * disclosure the sign-in form above is careful not to make.
   */
  if (error?.code === "over_email_send_rate_limit") {
    return { error: "tooManyRequests", values: { email } };
  }

  return { notice: "checkEmailReset" };
}

/**
 * Sets the new password. The caller is already signed in: `/auth/confirm`
 * exchanged the emailed token for a session before letting them reach this
 * form, which is why there is no token in the payload.
 */
export async function updatePasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = passwordField(formData, "password");
  const confirmation = passwordField(formData, "passwordConfirm");

  const fieldErrors = collectErrors({
    password: validatePassword(password),
    passwordConfirm: validatePasswordConfirmation(password, confirmation),
  });

  if (fieldErrors) return { fieldErrors };

  // A recovery link that was already used, or that expired, leaves no
  // session — so this is where an expired link actually surfaces, not on the
  // click.
  const user = await getCurrentUser();
  if (!user) return { error: "linkExpired" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: errorKey(error) };

  const current = await getCurrentProfile();
  const destination =
    current && !current.onboardedAt
      ? await localizedPath(ONBOARDING_PATH)
      : await localizedPath(AFTER_SIGN_IN_PATH);

  redirect(destination);
}

/* -------------------------------------------------------------------------
   Onboarding
   ------------------------------------------------------------------------- */

/**
 * The one write that ends onboarding.
 *
 * All four answers land in a single statement with `onboardedAt`, so there is
 * no window in which a profile is marked finished but half-empty. The
 * timestamp is the only completion signal the gate reads — see the schema.
 */
export async function completeOnboardingAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const current = await requireProfile();

  const displayName = field(formData, "displayName");
  const level = parseExperienceLevel(field(formData, "experienceLevel"));
  const goal = parseLearningGoal(field(formData, "goal"));
  const locale = parseUserLocale(field(formData, "locale"));

  const fieldErrors = collectErrors({
    displayName: validateDisplayName(displayName),
    experienceLevel: level ? null : "experienceLevelRequired",
    goal: goal ? null : "goalRequired",
    locale: locale ? null : "localeRequired",
  });

  // The three null checks repeat what `collectErrors` already found. They are
  // here for the type system, which cannot see that a populated `fieldErrors`
  // and a null `level` are the same fact — and it is worth keeping them
  // rather than asserting, because the assertion would survive someone later
  // dropping a rule from the map above.
  if (fieldErrors || !level || !goal || !locale) {
    return { fieldErrors: fieldErrors ?? undefined, values: { displayName } };
  }

  await db
    .update(profile)
    .set({
      displayName,
      experienceLevel: level,
      goal,
      locale,
      onboardedAt: new Date(),
    })
    // Scoped to the signed-in caller, never to an id from the form.
    .where(eq(profile.id, current.id));

  // Into the language they just chose, which may not be the one this page
  // was rendered in.
  redirect(getPathname({ href: AFTER_SIGN_IN_PATH, locale }));
}

/* -------------------------------------------------------------------------
   Account
   ------------------------------------------------------------------------- */

export async function updateProfileAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const current = await requireProfile();

  const displayName = field(formData, "displayName");
  const level = parseExperienceLevel(field(formData, "experienceLevel"));
  const goal = parseLearningGoal(field(formData, "goal"));
  const locale = parseUserLocale(field(formData, "locale"));

  // See the note on the same shape in `completeOnboardingAction`.
  const fieldErrors = collectErrors({
    displayName: validateDisplayName(displayName),
    experienceLevel: level ? null : "experienceLevelRequired",
    goal: goal ? null : "goalRequired",
    locale: locale ? null : "localeRequired",
  });

  if (fieldErrors || !level || !goal || !locale) {
    return { fieldErrors: fieldErrors ?? undefined, values: { displayName } };
  }

  await db
    .update(profile)
    .set({ displayName, experienceLevel: level, goal, locale })
    .where(eq(profile.id, current.id));

  // Changing the language changes the URL of this very page, so the redirect
  // is what makes the switch visible rather than leaving them on the old one.
  redirect(getPathname({ href: "/account", locale }));
}

/**
 * Changing a password from inside the account, which is a different thing
 * from the recovery flow above: this caller knows their current password and
 * is asked for it.
 *
 * Supabase can enforce that itself via `secure_password_change`, but only by
 * rejecting the whole call, and it is off in this project's config. Verifying
 * here means someone who walked up to an unlocked laptop cannot change the
 * password without knowing the old one — and it costs one extra round trip.
 */
export async function changePasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const currentPassword = passwordField(formData, "currentPassword");
  const password = passwordField(formData, "password");
  const confirmation = passwordField(formData, "passwordConfirm");

  const fieldErrors = collectErrors({
    currentPassword: currentPassword ? null : "passwordRequired",
    password: validatePassword(password),
    passwordConfirm: validatePasswordConfirmation(password, confirmation),
  });

  if (fieldErrors) return { fieldErrors };

  /**
   * Checked on a client with no session of its own — see
   * `createSupabaseCheckClient`. On the cookie-bound client this call is not a
   * read: `signInWithPassword` issues a fresh session and writes it over the
   * caller's cookies, as a side effect of what is meant to be a yes/no
   * question.
   *
   * Both calls hash a password with bcrypt, so this action is legitimately the
   * slowest in the file — a second or more under load. That is a real cost of
   * verifying rather than trusting the session, and it is worth paying.
   */
  const { error: verifyError } = await createSupabaseCheckClient().auth.signInWithPassword(
    { email: user.email!, password: currentPassword },
  );

  if (verifyError) {
    return { fieldErrors: { currentPassword: "currentPasswordWrong" } };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: errorKey(error) };

  /**
   * Redirect rather than return a notice, which is what this did first.
   *
   * `updateUser` rotates the session's tokens, so the action's response
   * carries new auth cookies. Returning state instead makes React re-render
   * this page inside that same response — a render that re-reads the session
   * while it is being replaced. Under concurrent load that render never
   * settled: the action had already succeeded in ~200ms, the password really
   * was changed, and the button sat disabled on its spinner indefinitely.
   *
   * A redirect ends the action, lets the new cookies land, and re-enters the
   * page as a fresh request. Every other mutating action here already
   * redirects; this one was the exception.
   */
  redirect(`${await localizedPath("/account")}?changed=password`);
}

/**
 * GDPR erasure. Deletes the auth user; `profile` follows through
 * `on delete cascade`, and so will every table that references it later.
 *
 * Typing the word is the confirmation, and the word is translated — matching
 * a hardcoded "DELETE" would ask a French user to type an English word to
 * erase their own account.
 */
export async function deleteAccountAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const confirmation = field(formData, "confirmation");
  const expected = field(formData, "expected");

  if (!expected || confirmation.toLocaleLowerCase() !== expected.toLocaleLowerCase()) {
    return { fieldErrors: { confirmation: "confirmationMismatch" } };
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "unexpected" };

  // Deleting the user does not invalidate tokens already issued, so the
  // cookie in this browser would still look like a valid session until it
  // expired. Clearing it is what actually ends the session.
  await supabase.auth.signOut({ scope: "local" });

  redirect(await localizedPath("/"));
}
