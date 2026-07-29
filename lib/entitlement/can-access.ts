import "server-only";

import { subscriptionStatus } from "@/lib/db/schema";

/**
 * The entitlement boundary. Every gate in the product calls this and nothing
 * else — no inline subscription checks, ever. See
 * docs/decisions/0006-entitlement-boundary-before-billing.md.
 *
 * No payment provider is anywhere near this file, and none will be. Phase 10
 * wires Stripe to `profile.subscription_status`; this function reads that
 * status and never learns where it came from. That is the whole point of
 * building the boundary before the billing.
 *
 * **Hard rule 3: never call this inside a `use cache` function.** It reads
 * user data, which is transactional and per-person; content is read-mostly and
 * cacheable. A cached function that called this would serve one visitor's
 * entitlement to everyone who followed. The `server-only` import above is half
 * the enforcement — the other half is the lint rule from PRO-186.
 *
 * `server-only` also fixes the shape of every call site: the decision is made
 * on the server and passed down as a prop. A client component receives an
 * `AccessDecision`, it never computes one.
 */

export type SubscriptionStatus = (typeof subscriptionStatus.enumValues)[number];

/**
 * Why a viewer cannot open something.
 *
 * The two are kept distinct rather than collapsed into a boolean because they
 * are different problems for the learner: one means "pay", the other means
 * "not yet". A locked state that says "subscribe" to someone who has already
 * subscribed — and merely has not finished the prerequisite — is worse than no
 * message at all.
 */
export type AccessDenial = "requires-subscription" | "requires-prerequisite";

export type AccessDecision =
  | { allowed: true }
  | { allowed: false; reason: AccessDenial };

/**
 * Whoever is asking. `null` is a signed-out visitor, which is a normal state
 * here rather than an error: the public lesson URL is the paywall
 * (ADR-0011), so a stranger from search must be able to reach a free preview
 * and be told about everything else.
 *
 * Structural, not `Profile`. `Profile` satisfies it today; so will whatever
 * carries subscription status after Phase 10 splits it into its own table.
 */
export interface Viewer {
  subscriptionStatus: SubscriptionStatus;
}

/**
 * What is being opened, described by its *facts* rather than by a
 * pre-computed verdict.
 *
 * This is deliberately not the fixtures' `AccessState`. That field is the
 * answer this function exists to produce — accepting it as input would make
 * the boundary a pass-through and leave the real decision scattered across
 * whoever populated it.
 */
export interface ContentResource {
  /**
   * Readable without a subscription. On a lesson this is `is_free_preview`
   * from docs/content-model.md, which calls it "the only free/paid switch";
   * on a course it means the whole course is open.
   */
  isFreePreview: boolean;
  /**
   * Whether the viewer has satisfied what comes before this.
   *
   * A property of the viewer *and* the resource, so it is passed in rather
   * than derived here — content declares its prerequisites, user progress
   * decides whether they are met, and Phase 12 is what makes that computable.
   * `undefined` means "nothing to satisfy", which is every resource today.
   */
  prerequisiteMet?: boolean;
}

/**
 * Which statuses grant access.
 *
 * `active` and `trialing` are uncontroversial. **`past_due` grants access**,
 * and that is the real decision in this file. Dunning has a grace period: a
 * card fails for a hundred boring reasons — an expiry, a bank's fraud
 * heuristic, a travelling customer — and Stripe retries over days. Cutting
 * someone off the moment the first retry fails turns a payment that would
 * have gone through into a cancellation, and it does it to paying customers
 * specifically.
 *
 * It lives here rather than in a webhook handler because it is a product
 * decision, not an integration detail. Phase 10 will be full of Stripe
 * events; none of them gets to quietly redefine who is entitled.
 */
const ENTITLING_STATUSES = new Set<SubscriptionStatus>([
  "active",
  "trialing",
  "past_due",
]);

/** `none` and `canceled` do not entitle. A signed-out viewer never does. */
export function hasEntitlingSubscription(viewer: Viewer | null): boolean {
  return viewer !== null && ENTITLING_STATUSES.has(viewer.subscriptionStatus);
}

/**
 * The one gate.
 *
 * **Subscription is checked before prerequisite**, so someone who has neither
 * subscribed nor finished the prerequisite is told to subscribe. Both are
 * true, and that one is the one they can act on now; "come back when you have
 * finished an earlier course" is a strange thing to say to a visitor who
 * cannot open that course either.
 *
 * A free preview waives the subscription requirement and nothing else — being
 * free to read does not mean being ready to read.
 */
export function canAccess(
  viewer: Viewer | null,
  resource: ContentResource,
): AccessDecision {
  if (!resource.isFreePreview && !hasEntitlingSubscription(viewer)) {
    return { allowed: false, reason: "requires-subscription" };
  }

  if (resource.prerequisiteMet === false) {
    return { allowed: false, reason: "requires-prerequisite" };
  }

  return { allowed: true };
}

/**
 * A diagnostic summary — the raw status *and* what the boundary makes of it.
 *
 * For the observability smoke panel, which needs to answer "is entitlement
 * wired up in this environment" and cannot do that from the status alone.
 * Reporting both is also what makes a disagreement visible: a status of
 * `active` next to a `requires-subscription` decision is a bug you can see.
 *
 * It lives here rather than at the call site because the call site would
 * otherwise have to read `subscriptionStatus` itself, and PRO-186's lint rule
 * cannot tell a diagnostic read from a gate. Keeping the field's only readers
 * inside this module is what lets that rule stay absolute.
 */
export function describeAccess(viewer: Viewer | null) {
  return {
    subscriptionStatus: viewer?.subscriptionStatus ?? null,
    entitled: hasEntitlingSubscription(viewer),
    freePreview: canAccess(viewer, { isFreePreview: true }),
    paid: canAccess(viewer, { isFreePreview: false }),
  };
}
