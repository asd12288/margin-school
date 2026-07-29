import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * ADR-0006: *"It must be gated by environment and covered by a test that fails
 * if it is reachable in production."*
 *
 * So these assert **absence**, not presence. A suite that only checked "the
 * toggle works locally" passes just as happily on the day someone deletes the
 * gate, which is the failure this test exists to catch.
 *
 * `isProduction` and the Supabase URL are read when the module first
 * evaluates, so each case resets the module registry and re-imports rather
 * than mutating a value that has already been captured.
 */
async function toggleEnabledWith(env: {
  appEnv?: string;
  supabaseUrl?: string;
}): Promise<boolean> {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_APP_ENV", env.appEnv);
  vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", undefined);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", env.supabaseUrl);

  const { isSubscriptionToggleEnabled } = await import(
    "@/lib/entitlement/dev-toggle"
  );
  return isSubscriptionToggleEnabled();
}

const LOCAL_URL = "http://127.0.0.1:54321";
const CLOUD_URL = "https://abcdefgh.supabase.co";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("the dev subscription toggle is unreachable in production", () => {
  it("is closed in production, whatever the database says", async () => {
    expect(
      await toggleEnabledWith({ appEnv: "production", supabaseUrl: CLOUD_URL }),
    ).toBe(false);
    expect(
      await toggleEnabledWith({ appEnv: "production", supabaseUrl: LOCAL_URL }),
    ).toBe(false);
  });

  it("is closed on preview, because preview shares the production database", async () => {
    // ADR-0010. A preview deploy is a public URL writing to real production
    // Postgres; a subscription toggle there is not a dev convenience.
    expect(
      await toggleEnabledWith({ appEnv: "preview", supabaseUrl: CLOUD_URL }),
    ).toBe(false);
  });

  it("is closed when APP_ENV is missing and would fall back to local", async () => {
    // The hole the database check exists to close. `resolveAppEnv()` defaults
    // to "local" with no env vars set, so a deploy that lost its config would
    // otherwise open the toggle against a cloud database.
    expect(await toggleEnabledWith({ supabaseUrl: CLOUD_URL })).toBe(false);
  });

  it("is closed against a cloud database even when APP_ENV says local", async () => {
    expect(
      await toggleEnabledWith({ appEnv: "local", supabaseUrl: CLOUD_URL }),
    ).toBe(false);
  });
});

describe("the gate fails shut on anything it cannot positively verify", () => {
  it("is closed when the Supabase URL is unset", async () => {
    expect(await toggleEnabledWith({ appEnv: "local" })).toBe(false);
  });

  it("is closed when the Supabase URL cannot be parsed", async () => {
    expect(
      await toggleEnabledWith({ appEnv: "local", supabaseUrl: "not a url" }),
    ).toBe(false);
  });

  it("is not fooled by a hostname that merely contains a local one", async () => {
    // The exact mistake scripts/seed-test-users.ts documents. Both of these
    // pass a substring check and both are remote hosts.
    expect(
      await toggleEnabledWith({
        appEnv: "local",
        supabaseUrl: "https://127.0.0.1.evil-project.supabase.co",
      }),
    ).toBe(false);
    expect(
      await toggleEnabledWith({
        appEnv: "local",
        supabaseUrl: "https://prod-ref.supabase.co/?ref=localhost",
      }),
    ).toBe(false);
  });
});

describe("the toggle is open in local development", () => {
  it("opens for a local stack", async () => {
    // The one combination that should work — asserted last, so a failure here
    // reads as "the toggle is broken" rather than "the gate is broken".
    expect(
      await toggleEnabledWith({ appEnv: "local", supabaseUrl: LOCAL_URL }),
    ).toBe(true);
    expect(
      await toggleEnabledWith({
        appEnv: "local",
        supabaseUrl: "http://localhost:54321",
      }),
    ).toBe(true);
  });
});
