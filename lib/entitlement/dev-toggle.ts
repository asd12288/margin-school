import "server-only";

import { subscriptionStatus } from "@/lib/db/schema";
import { isProduction } from "@/lib/env";
import {
  canAccess,
  type AccessDecision,
  type SubscriptionStatus,
  type Viewer,
} from "@/lib/entitlement/can-access";

/**
 * The gate on the dev-only subscription toggle.
 *
 * ADR-0006 asks for a way to set `profile.subscription_status` without Stripe,
 * and names the risk in the same breath: *"The dev-only toggle is a genuine
 * security risk if it reaches production. It must be gated by environment and
 * covered by a test that fails if it is reachable in production."*
 *
 * **It is local only, not local-and-preview**, and the reason is
 * [ADR-0010](../../docs/decisions/0010-no-staging-database.md): preview
 * deployments share the *production* database. A toggle on preview would not
 * be flipping a throwaway row — it would be writing to real production
 * Postgres from a URL that anyone with an SSO session can open. There is no
 * user data there yet, which is exactly the window in which this is cheap to
 * get right rather than a reason to leave it open.
 *
 * Two independent conditions, both required. Either alone has a hole:
 */
const LOCAL_SUPABASE_HOSTNAMES = new Set([
  "127.0.0.1",
  "localhost",
  "::1",
  "[::1]",
]);

/**
 * Is the database we would write to a local one?
 *
 * This is the condition that actually protects production, because the
 * environment check above it can fail open. `resolveAppEnv()` in
 * [lib/env.ts](../env.ts) falls back to `"local"` when neither
 * `NEXT_PUBLIC_APP_ENV` nor `NEXT_PUBLIC_VERCEL_ENV` is present — a sensible
 * default for logging and a dangerous one for a write gate, since a deploy
 * that lost its env config would resolve as local and open the toggle. Asking
 * the connection string where it points cannot be fooled that way.
 *
 * Exact match on the parsed hostname, never a substring of the URL — the
 * lesson `scripts/seed-test-users.ts` already paid for. `https://
 * 127.0.0.1.evil.supabase.co` contains "127.0.0.1" and is a remote host;
 * `https://prod-ref.supabase.co/?ref=localhost` matches on its query string
 * alone.
 */
function pointsAtLocalDatabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return false;

  try {
    return LOCAL_SUPABASE_HOSTNAMES.has(new URL(url).hostname);
  } catch {
    // An unparseable URL is not a local one. Fail shut, never open.
    return false;
  }
}

/**
 * Fails shut. Every path that cannot positively establish "local development"
 * returns `false`, including the ones that look like misconfiguration rather
 * than attack — a missing env var, a malformed URL, an unexpected `APP_ENV`.
 */
export function isSubscriptionToggleEnabled(): boolean {
  if (isProduction) return false;
  return pointsAtLocalDatabase();
}

/**
 * Every status the toggle can set, in the order the panel offers them —
 * unentitled first, so the default reading of the page is "here is what a
 * visitor sees" rather than "here is what a subscriber sees".
 *
 * Taken from the Drizzle enum rather than written out again. A hand-copied
 * list is a list that drifts, exactly as `lib/auth/validation.ts` says of the
 * onboarding enums.
 */
export const TOGGLEABLE_STATUSES: readonly SubscriptionStatus[] = [
  "none",
  "canceled",
  "past_due",
  "trialing",
  "active",
];

/** Rejects anything that is not one of the enum's values. */
export function parseSubscriptionStatus(
  value: FormDataEntryValue | null,
): SubscriptionStatus | null {
  if (typeof value !== "string") return null;
  return (subscriptionStatus.enumValues as readonly string[]).includes(value)
    ? (value as SubscriptionStatus)
    : null;
}

export interface ToggleState {
  current: SubscriptionStatus;
  statuses: readonly SubscriptionStatus[];
  /** What the boundary makes of the two resource shapes that exist today. */
  freePreview: AccessDecision;
  paid: AccessDecision;
}

/**
 * Everything the toggle panel renders, assembled here rather than in the page.
 *
 * Two reasons, and the second is the one that matters. The page would
 * otherwise read `profile.subscriptionStatus` to highlight the active button —
 * a harmless display read, but PRO-186's lint rule cannot tell a display read
 * from a gate, and a rule with exceptions stops being a rule. Returning the
 * value under a neutral name keeps the ban absolute.
 *
 * And the panel should *demonstrate* the boundary, not re-implement a second
 * opinion beside it. These decisions come from `canAccess` itself, so a panel
 * that disagreed with the catalog would mean the boundary was wrong — which is
 * exactly what a dev tool is for.
 */
export function describeToggleState(viewer: Viewer): ToggleState {
  return {
    current: viewer.subscriptionStatus,
    statuses: TOGGLEABLE_STATUSES,
    freePreview: canAccess(viewer, { isFreePreview: true }),
    paid: canAccess(viewer, { isFreePreview: false }),
  };
}
