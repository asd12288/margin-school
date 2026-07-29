import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * Guards on supabase/config.toml.
 *
 * Unusual for a unit test to read a config file, and it earns its place: the
 * Supabase GitHub integration re-applies this file to the production project on
 * every push to `main`, from a machine with no `.env.local`. An unresolved
 * `env(...)` is not an error there — it is pushed as a literal string. That is
 * how `env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)` once went out as the Google
 * client id and killed sign-in with `401: invalid_client`, green build and all.
 *
 * Nothing else in this repo can catch that. The type checker never sees TOML,
 * there is no CI, and the push reports success. So the check lives here, in the
 * suite that does run.
 */

const config = readFileSync("supabase/config.toml", "utf8");

/** Section header → the non-comment, non-blank lines underneath it. */
function tables(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  let current = "";

  for (const line of config.split("\n")) {
    const header = line.trim().match(/^\[([^\]]+)\]$/);
    if (header) {
      current = header[1];
      out.set(current, []);
      continue;
    }
    const body = line.trim();
    if (!current || body === "" || body.startsWith("#")) continue;
    out.get(current)!.push(body);
  }

  return out;
}

function valueOf(table: string, key: string): string | undefined {
  const line = tables()
    .get(table)
    ?.find((entry) => entry.startsWith(`${key} `) || entry.startsWith(`${key}=`));
  return line?.split("=").slice(1).join("=").trim().replace(/^"|"$/g, "");
}

describe("supabase/config.toml — the production remote", () => {
  it("resolves every value without env(), because the pushing machine has none", () => {
    const offenders = [...tables().entries()]
      .filter(([table]) => table.startsWith("remotes."))
      .flatMap(([table, lines]) =>
        lines.filter((line) => line.includes("env(")).map((line) => `[${table}] ${line}`)
      );

    expect(offenders).toEqual([]);
  });

  it("keeps the Google client id identical to the base block", () => {
    // One OAuth client serves local, preview and production. If these drift,
    // one environment is talking to a client that does not have its redirect
    // URI registered, and the failure is a Google error page two origins away.
    expect(valueOf("remotes.production.auth.external.google", "client_id")).toBe(
      valueOf("auth.external.google", "client_id")
    );
  });

  it("leaves the production Google secret empty so the push omits it", () => {
    // Empty means "send nothing", which means production keeps the secret set
    // on the project. A real value here would be a secret in a public file; an
    // env() here would overwrite a working secret with the literal string.
    expect(valueOf("remotes.production.auth.external.google", "secret")).toBe("");
  });
});

describe("supabase/config.toml — settings production inherits", () => {
  /**
   * The base config is not local-only. Anything not restated under
   * `[remotes.production.*]` is what production gets, so a value that is
   * merely convenient for the e2e suite ships as a production setting.
   */
  it("requires reauthentication before a password change", () => {
    // Set in the base block on purpose, so the e2e suite runs against the same
    // rule production does. Off, the Auth API changes a password on a valid
    // access token alone, with no idea whether the caller knows the old one.
    expect(valueOf("auth.email", "secure_password_change")).toBe("true");
  });

  it("keeps MFA off until there is something to answer a challenge", () => {
    // These are pushed unconditionally — no `if defined` guard, unlike the
    // captcha block. Enrolment enabled with no AAL2 handling in the app means
    // someone can enrol a factor through the API and lock themselves out.
    expect(valueOf("auth.mfa.totp", "enroll_enabled")).toBe("false");
    expect(valueOf("auth.mfa.totp", "verify_enabled")).toBe("false");
  });

  it("leaves SMTP off, which is what makes the email rate limit inert", () => {
    // The CLI only sends `rate_limit_email_sent` when `[auth.email.smtp]` is
    // enabled, so while it is not, `[remotes.production.auth.rate_limit]
    // .email_sent` is documentation and the comment there says so.
    //
    // Enabling SMTP fails this test on purpose. That is the moment the number
    // becomes a real production limit, and 2/hour is the cap on Supabase's
    // shared sender — not a figure anyone chose for a domain of our own.
    expect(valueOf("auth.email.smtp", "enabled")).not.toBe("true");
  });
});

describe("supabase/config.toml — the local stack", () => {
  it("keeps enabled as a literal bool", () => {
    // Substitution runs before parsing, but an unset variable becomes "", and
    // "" is not a bool — so env() here means the stack refuses to start at all.
    expect(valueOf("auth.external.google", "enabled")).toBe("true");
  });

  it("never commits the Google client secret", () => {
    expect(config).not.toMatch(/GOCSPX-/);
    expect(valueOf("auth.external.google", "secret")).toBe(
      "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
    );
  });
});
