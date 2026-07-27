import "server-only";

import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { SIGN_IN_PATH } from "@/lib/auth/routes";
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

/** For pages that require a signed-in user. Redirects instead of returning null. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect(SIGN_IN_PATH);

  return user;
}

/** For pages that require a profile — anything reading role, locale or access. */
export async function requireProfile(): Promise<Profile> {
  const current = await getCurrentProfile();
  if (!current) redirect(SIGN_IN_PATH);

  return current;
}

/**
 * Role gate. Signed-out users go to sign-in; signed-in users without the role
 * get a 404.
 *
 * 404 rather than 403 is deliberate. Next's `forbidden()` needs the
 * experimental `authInterrupts` flag, and foundational auth should not rest on
 * an experimental API. It is also the better answer for staff routes: a 403
 * confirms that `/admin` exists, a 404 tells a probing student nothing.
 */
export async function requireRole(
  ...allowed: Array<Profile["role"]>
): Promise<Profile> {
  const current = await requireProfile();
  if (!allowed.includes(current.role)) notFound();

  return current;
}
