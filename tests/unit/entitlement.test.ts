import { describe, expect, it } from "vitest";

import {
  canAccess,
  hasEntitlingSubscription,
  type SubscriptionStatus,
} from "@/lib/entitlement/can-access";
import { subscriptionStatus } from "@/lib/db/schema";

/**
 * The boundary is a pure function, so this covers it exhaustively rather than
 * by example: every status × free/paid × signed-out. That is 12 cases and they
 * all run in under a millisecond, which is the argument for keeping the
 * decision in a pure function in the first place.
 */

const PAID = { isFreePreview: false };
const FREE = { isFreePreview: true };

const viewer = (status: SubscriptionStatus) => ({ subscriptionStatus: status });

const ENTITLED: SubscriptionStatus[] = ["active", "trialing", "past_due"];
const NOT_ENTITLED: SubscriptionStatus[] = ["none", "canceled"];

describe("hasEntitlingSubscription", () => {
  it.each(ENTITLED)("%s entitles", (status) => {
    expect(hasEntitlingSubscription(viewer(status))).toBe(true);
  });

  it.each(NOT_ENTITLED)("%s does not entitle", (status) => {
    expect(hasEntitlingSubscription(viewer(status))).toBe(false);
  });

  it("treats a signed-out visitor as unentitled", () => {
    expect(hasEntitlingSubscription(null)).toBe(false);
  });

  it("covers every status the schema defines", () => {
    // If Phase 10 adds a status — `incomplete`, `unpaid`, `paused` — this
    // fails until someone decides which side of the line it falls on. That
    // decision belongs in canAccess, and silently defaulting a new status to
    // "no access" would lock out paying customers on the day it shipped.
    expect([...ENTITLED, ...NOT_ENTITLED].sort()).toEqual(
      [...subscriptionStatus.enumValues].sort(),
    );
  });
});

describe("canAccess — the subscription axis", () => {
  it.each(ENTITLED)("opens paid content for %s", (status) => {
    expect(canAccess(viewer(status), PAID)).toEqual({ allowed: true });
  });

  it.each(NOT_ENTITLED)("locks paid content for %s", (status) => {
    expect(canAccess(viewer(status), PAID)).toEqual({
      allowed: false,
      reason: "requires-subscription",
    });
  });

  it("locks paid content for a signed-out visitor", () => {
    expect(canAccess(null, PAID)).toEqual({
      allowed: false,
      reason: "requires-subscription",
    });
  });

  it("opens a free preview to a signed-out visitor", () => {
    // ADR-0011: the public lesson URL is the paywall. A stranger arriving from
    // search lands on the lesson itself, so a free preview has to render for
    // someone with no account at all.
    expect(canAccess(null, FREE)).toEqual({ allowed: true });
  });

  it.each([...ENTITLED, ...NOT_ENTITLED])(
    "opens a free preview for %s regardless of status",
    (status) => {
      expect(canAccess(viewer(status), FREE)).toEqual({ allowed: true });
    },
  );
});

describe("canAccess — the prerequisite axis", () => {
  it("stays out of the way when there is no prerequisite", () => {
    expect(canAccess(viewer("active"), { ...PAID })).toEqual({ allowed: true });
    expect(
      canAccess(viewer("active"), { ...PAID, prerequisiteMet: undefined }),
    ).toEqual({ allowed: true });
  });

  it("locks a subscriber who has not met the prerequisite", () => {
    expect(
      canAccess(viewer("active"), { ...PAID, prerequisiteMet: false }),
    ).toEqual({ allowed: false, reason: "requires-prerequisite" });
  });

  it("applies to free previews too — free to read is not ready to read", () => {
    expect(canAccess(null, { ...FREE, prerequisiteMet: false })).toEqual({
      allowed: false,
      reason: "requires-prerequisite",
    });
  });

  it("reports the subscription first when both fail", () => {
    // Both are true; only one is actionable now. Telling an unsubscribed
    // visitor to go finish an earlier course sends them to something they
    // cannot open either.
    expect(canAccess(null, { isFreePreview: false, prerequisiteMet: false })).toEqual(
      { allowed: false, reason: "requires-subscription" },
    );
  });
});
