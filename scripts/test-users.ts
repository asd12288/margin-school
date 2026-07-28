/**
 * Shared identifiers for the two seeded local test accounts.
 *
 * `scripts/seed-test-users.ts` runs top-level, side-effectful seeding code
 * on import (it creates the accounts as soon as the module loads), so
 * `tests/e2e/fixtures/session.ts` cannot import from it without triggering a
 * seed run every time Playwright loads the fixture. This module holds just
 * the constants, with no side effects, so both files can import the same
 * values instead of each declaring their own copy that can drift.
 */
export const TEST_PASSWORD = "test-password-123";

export const TEST_EMAILS = {
  student: "student@test.local",
  editor: "editor@test.local",
  admin: "admin@test.local",
  /**
   * Signed up but never answered the onboarding questions.
   *
   * Onboarding blocks (ADR-0012), so every other seeded account has to be
   * past it or none of the app routes would be reachable in a test. This one
   * exists to prove the gate is actually there — without it, a bug that
   * skipped onboarding entirely would look identical to a passing suite.
   */
  newcomer: "newcomer@test.local",
} as const;
