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
} as const;
