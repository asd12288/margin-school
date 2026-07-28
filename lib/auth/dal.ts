import "server-only";

import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { cache } from "react";

import { redirect } from "@/i18n/navigation";
import { type StaticPathname } from "@/i18n/routing";
import { ONBOARDING_PATH, SIGN_IN_PATH } from "@/lib/auth/routes";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db/client";
import { profile, type Profile } from "@/lib/db/schema";

/**
 * The Data Access Layer: the single place authorization is decided.
 *
 * The proxy performs optimistic redirects so signed-out users do not see a
 * flash of protected UI, but it is **not** a security boundary — it reads a
 * cookie and nothing more. Every real check happens here, as close to the
 * data as possible.
 *
 * Each function is wrapped in React's `cache`, so a page calling
 * `getCurrentProfile()` in five components performs one auth round trip and
 * one query per render pass.
 */

/**
 * Always `getUser()`, never `getSession()`.
 *
 * `getSession()` reads the cookie and trusts it. `getUser()` validates the
 * token with the auth server. A forged cookie passes the first and fails the
 * second, so the distinction is the whole security model, not a preference.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return user;
});

/** The application's own view of the person: role, locale, subscription. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const [row] = await db
    .select()
    .from(profile)
    .where(eq(profile.id, user.id))
    .limit(1);

  // A signed-in user with no profile means the signup trigger did not fire.
  // Returning null rather than inventing a row keeps that failure visible.
  return row ?? null;
});

/**
 * Sends the visitor to a localized route.
 *
 * `redirect("/sign-in")` from `next/navigation` would land on the unprefixed
 * URL, which next-intl's proxy then redirects again — two round trips, and a
 * French reader passing through an English-looking URL on the way. The
 * wrapper from i18n/navigation resolves the translated segment
 * (`/fr/connexion`) in one hop.
 *
 * The locale is fetched by the caller rather than in here, and this stays
 * **synchronous on purpose**. `redirect` works by throwing, and its `never`
 * return is what tells TypeScript that the line after `if (!current)` is
 * unreachable — so a `Profile | null` narrows to `Profile` with no assertion.
 * Wrapping it in an `async` helper turns `never` into `Promise<never>`, the
 * narrowing is lost, and every call site needs a `!` that would then survive
 * the guard being deleted.
 */
function redirectLocalized(href: StaticPathname, locale: string): never {
  // `return`, not a bare call. next-intl exports `redirect` as a destructured
  // property rather than a function declaration, and TypeScript only treats a
  // never-returning *call* as an unreachable end point when the callee is
  // explicitly annotated — which a destructured binding is not. Returning the
  // expression states the same thing in a form the checker accepts.
  return redirect({ href, locale });
}

/** For pages that require a signed-in user. Redirects instead of returning null. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirectLocalized(SIGN_IN_PATH, await getLocale());

  return user;
}

/**
 * For pages that require a profile — anything reading role, locale or access.
 *
 * Note this does **not** require onboarding to be finished, which makes it
 * the right gate for exactly two things: `/onboarding` itself, where the
 * onboarded variant would redirect to itself forever, and `/reset-password`,
 * where someone arriving from a recovery email must be able to set a password
 * before being asked anything. Every other signed-in route wants
 * `requireOnboardedProfile` below.
 */
export async function requireProfile(): Promise<Profile> {
  const current = await getCurrentProfile();
  if (!current) redirectLocalized(SIGN_IN_PATH, await getLocale());

  return current;
}

/** Onboarding is finished. The only signal is the timestamp — see the schema. */
export function isOnboarded(current: Profile): boolean {
  return current.onboardedAt !== null;
}

/** `editor` and `admin` are staff; `student` is not. */
export function isStaff(current: Profile): boolean {
  return current.role === "editor" || current.role === "admin";
}

/**
 * The gate for every signed-in route except `/onboarding` and `/account`.
 *
 * Onboarding blocks (ADR-0012), so an unfinished profile is bounced to it
 * rather than allowed through with half its fields null. `/onboarding` itself
 * must call `requireProfile`, not this — calling this there is an infinite
 * redirect.
 */
export async function requireOnboardedProfile(): Promise<Profile> {
  const current = await requireProfile();
  if (!isOnboarded(current)) redirectLocalized(ONBOARDING_PATH, await getLocale());

  return current;
}

/**
 * Role gate. Signed-out users go to sign-in; signed-in users without the role
 * get a 404.
 *
 * 404 rather than 403 is deliberate. Next's `forbidden()` needs the
 * experimental `authInterrupts` flag, and foundational auth should not rest on
 * an experimental API.
 *
 * What the 404 actually buys, under `cacheComponents`: a signed-out prober
 * never sees this page at all — the proxy redirects before it renders — and
 * the response body never mentions permissions, roles, or that the route
 * exists. It does not buy indistinguishability by status code. This gate's
 * cookie read has to be wrapped in `<Suspense>` (an unwrapped read fails the
 * build — see docs/ux-architecture.md), so the `notFound()` it throws
 * streams, and Next serves a streamed response as `200` regardless of what
 * rendered. A genuinely missing route, by contrast, 404s for real. A
 * signed-in student hitting `/admin` can therefore tell "exists but blocked"
 * from "does not exist" by status code alone — `connection()` and
 * `dynamic = "force-dynamic"` were both tried as fixes and neither works
 * under `cacheComponents`. The exposure is small in practice: `/admin` is a
 * URL anyone would guess, and nothing else leaks.
 *
 * Onboarding is checked before the role is, so a new editor lands on
 * `/onboarding` rather than on a 404 they have no way to interpret.
 */
export async function requireRole(
  ...allowed: Array<Profile["role"]>
): Promise<Profile> {
  const current = await requireOnboardedProfile();
  if (!allowed.includes(current.role)) notFound();

  return current;
}
