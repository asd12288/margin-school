import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Guards on the host allowlist in lib/auth/site-url.ts.
 *
 * `siteOrigin()` decides the origin of every link we mail — confirmation and
 * password recovery both — and of the OAuth callback. It reads that origin off
 * a request header, which is data, so the question these tests answer is what
 * happens when the data is hostile.
 *
 * They also pin the boring direction, which is the one that actually breaks
 * things: a preview must return to *itself*, and local development must keep
 * working on whatever port it is on. An allowlist that fails closed here would
 * take auth emails down, which is the failure this file is most exposed to.
 */

const REAL_ENV = { ...process.env };

const headerStore = new Map<string, string>();

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => headerStore.get(name.toLowerCase()) ?? null,
  }),
}));

/**
 * Loads a fresh copy of the module under a given environment.
 *
 * Both `lib/env.ts` and the platform host list are read at module scope, so a
 * plain import would freeze whichever environment ran first.
 */
async function siteOriginWith(
  env: Record<string, string | undefined>,
  requestHeaders: Record<string, string>,
) {
  vi.resetModules();

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  headerStore.clear();
  for (const [key, value] of Object.entries(requestHeaders)) {
    headerStore.set(key.toLowerCase(), value);
  }

  const { siteOrigin } = await import("@/lib/auth/site-url");
  return siteOrigin();
}

const PRODUCTION = {
  NEXT_PUBLIC_APP_ENV: "production",
  VERCEL_PROJECT_PRODUCTION_URL: "margin-school.vercel.app",
  VERCEL_BRANCH_URL: "margin-school-git-main-asd12288s-projects.vercel.app",
  VERCEL_URL: "margin-school-abc123-asd12288s-projects.vercel.app",
};

const PREVIEW = {
  NEXT_PUBLIC_APP_ENV: "preview",
  VERCEL_PROJECT_PRODUCTION_URL: "margin-school.vercel.app",
  VERCEL_BRANCH_URL: "margin-school-git-feat-x-asd12288s-projects.vercel.app",
  VERCEL_URL: "margin-school-def456-asd12288s-projects.vercel.app",
};

const OFF_VERCEL = {
  NEXT_PUBLIC_APP_ENV: "local",
  VERCEL_PROJECT_PRODUCTION_URL: undefined,
  VERCEL_BRANCH_URL: undefined,
  VERCEL_URL: undefined,
};

afterEach(() => {
  process.env = { ...REAL_ENV };
});

describe("siteOrigin — off Vercel", () => {
  it("trusts the request, because there is nothing to check it against", async () => {
    // The e2e suite runs the production build on 3100, and `next dev` prints
    // localhost while config.toml says 127.0.0.1. An allowlist here would have
    // to enumerate ports it cannot know.
    await expect(
      siteOriginWith(OFF_VERCEL, { host: "127.0.0.1:3100" }),
    ).resolves.toBe("http://127.0.0.1:3100");
  });

  it("keeps localhost on http", async () => {
    await expect(
      siteOriginWith(OFF_VERCEL, { "x-forwarded-host": "localhost:3000" }),
    ).resolves.toBe("http://localhost:3000");
  });
});

describe("siteOrigin — on Vercel", () => {
  it("returns the production domain when that is what was asked for", async () => {
    await expect(
      siteOriginWith(PRODUCTION, { "x-forwarded-host": "margin-school.vercel.app" }),
    ).resolves.toBe("https://margin-school.vercel.app");
  });

  it("accepts the per-deployment hostname too", async () => {
    // Production is reachable at all three; a link built from any of them is
    // still a link to us, and Supabase's allowlist covers the pattern.
    await expect(
      siteOriginWith(PRODUCTION, { "x-forwarded-host": PRODUCTION.VERCEL_URL }),
    ).resolves.toBe(`https://${PRODUCTION.VERCEL_URL}`);
  });

  it("refuses a host we do not answer to, and falls back to production", async () => {
    // The poisoned password-reset link: without this, `redirectTo` would carry
    // the attacker's origin and only Supabase's allowlist would reject it.
    await expect(
      siteOriginWith(PRODUCTION, { "x-forwarded-host": "evil.example" }),
    ).resolves.toBe("https://margin-school.vercel.app");
  });

  it("does not let a refused host downgrade the scheme", async () => {
    // `x-forwarded-proto` arrives on the same request as the host it came
    // with. Honouring it after rejecting the host would produce an http link
    // to the right domain, which Supabase rejects as off-allowlist.
    await expect(
      siteOriginWith(PRODUCTION, {
        "x-forwarded-host": "evil.example",
        "x-forwarded-proto": "http",
      }),
    ).resolves.toBe("https://margin-school.vercel.app");
  });

  it("sends a preview back to itself, never to production", async () => {
    // Preview shares production's Supabase project (ADR-0010), so a fallback
    // to the production domain here would mail a reset link to production —
    // the exact bug `absoluteUrl` reads the request to avoid.
    await expect(
      siteOriginWith(PREVIEW, { "x-forwarded-host": "evil.example" }),
    ).resolves.toBe(`https://${PREVIEW.VERCEL_BRANCH_URL}`);
  });

  it("matches on hostname, ignoring a port the platform never sets", async () => {
    await expect(
      siteOriginWith(PRODUCTION, { "x-forwarded-host": "margin-school.vercel.app:443" }),
    ).resolves.toBe("https://margin-school.vercel.app:443");
  });
});
