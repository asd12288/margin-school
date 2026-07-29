"use server";

import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireProfile } from "@/lib/auth/dal";
import { db } from "@/lib/db/client";
import { profile } from "@/lib/db/schema";
import {
  isSubscriptionToggleEnabled,
  parseSubscriptionStatus,
} from "@/lib/entitlement/dev-toggle";

/**
 * Sets the caller's own subscription status, with no payment provider
 * involved. Phase 5's stand-in for Stripe — see ADR-0006.
 *
 * **The gate is re-checked here, not merely on the page that renders the
 * form.** A server action is a public POST endpoint with a stable id; it is
 * reachable by anyone who can construct the request, whether or not a page
 * ever rendered a button for them. Gating only the page would leave the write
 * itself open, which is the whole risk ADR-0006 names.
 *
 * `notFound()` rather than an error: a request that should not have been
 * possible is told nothing about why it failed.
 *
 * **It can only ever change the caller's own row.** The id comes from
 * `requireProfile()` — the session — and never from the form, so there is no
 * parameter to tamper with to promote somebody else.
 */
export async function setSubscriptionStatusAction(formData: FormData) {
  if (!isSubscriptionToggleEnabled()) notFound();

  const current = await requireProfile();

  const status = parseSubscriptionStatus(formData.get("status"));
  if (!status) notFound();

  const locale = (await getLocale()) as Locale;

  await db
    .update(profile)
    .set({ subscriptionStatus: status })
    .where(eq(profile.id, current.id));

  // `updated_at` is maintained by the `profile_set_updated_at` trigger, so it
  // is deliberately not set here — a hand-written timestamp would be the one
  // the trigger then overwrites, and the two would disagree in review.

  /*
   * Redirect rather than falling off the end, which is what
   * `updateProfileAction` does after its write and for a reason worth
   * repeating here.
   *
   * Returning from an action makes Next re-render the current page *inside the
   * action's own request*, where the cookie store is the mutable one. The
   * Supabase SSR client cannot use that store, and `requireProfile()` in the
   * re-rendered page dies with "Received an underlying cookies object that
   * does not match either `cookies` or `mutableCookies`" — an internal-looking
   * invariant that says nothing about the actual cause. Redirecting sends the
   * browser back for a fresh GET, where the store is the ordinary read-only
   * one and the page renders normally.
   *
   * The locale is resolved rather than hardcoded: this route is untranslated,
   * but it still lives under `/fr/…` and `/en/…`, and a bare path would bounce
   * a French editor through next-intl's redirect on every click.
   */
  redirect(getPathname({ href: "/debug/subscription", locale }));
}
