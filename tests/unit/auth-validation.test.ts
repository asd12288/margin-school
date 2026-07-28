import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/lib/auth/routes";
import {
  collectErrors,
  field,
  MAX_DISPLAY_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  parseExperienceLevel,
  parseLearningGoal,
  parseUserLocale,
  passwordField,
  validateDisplayName,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from "@/lib/auth/validation";

/**
 * The pure half of auth.
 *
 * Everything here runs without a server, a database or a browser, which is why
 * it is worth having as unit tests rather than leaving to the e2e suite: the
 * open-redirect cases below are exactly the kind that are tedious to reach
 * through a browser and trivial to get wrong in a refactor.
 */

describe("safeNextPath", () => {
  it("keeps a same-site path", () => {
    expect(safeNextPath("/fr/apprendre")).toBe("/fr/apprendre");
  });

  it("keeps a path with a query string", () => {
    expect(safeNextPath("/en/courses?q=risk")).toBe("/en/courses?q=risk");
  });

  it.each([undefined, null, ""])("rejects %p", (value) => {
    expect(safeNextPath(value)).toBeNull();
  });

  /**
   * The whole point of the function. `?next=` is attacker-controlled — anyone
   * can send a link to `/sign-in?next=…` — so a value that escapes the site
   * hands a freshly authenticated user to someone else, wearing our domain in
   * the referrer.
   */
  describe("refuses to leave the site", () => {
    it.each([
      ["an absolute URL", "https://evil.example/steal"],
      ["a protocol-relative URL", "//evil.example"],
      ["a backslash-relative URL", "/\\evil.example"],
      ["a scheme-only value", "javascript:alert(1)"],
      ["a bare host", "evil.example"],
    ])("rejects %s", (_label, value) => {
      expect(safeNextPath(value)).toBeNull();
    });
  });

  /**
   * `//evil.example` and `/\evil.example` both start with `/`, so the obvious
   * `startsWith("/")` check passes them and a browser reads both as another
   * origin. This asserts the guard is not that check.
   */
  it("is not merely a leading-slash check", () => {
    expect(safeNextPath("//evil.example")).toBeNull();
    expect("//evil.example".startsWith("/")).toBe(true);
  });
});

describe("reading form fields", () => {
  function form(entries: Record<string, string>) {
    const data = new FormData();
    for (const [key, value] of Object.entries(entries)) data.append(key, value);
    return data;
  }

  it("trims ordinary fields", () => {
    expect(field(form({ email: "  a@b.co  " }), "email")).toBe("a@b.co");
  });

  it("returns an empty string for a missing field", () => {
    expect(field(form({}), "email")).toBe("");
  });

  /**
   * Passwords are read without trimming. Trimming would sign someone up with
   * one password and then refuse the one they typed on the way back in — a
   * failure that looks like "the site forgot my password".
   */
  it("does not trim passwords", () => {
    expect(passwordField(form({ password: "  spaced  " }), "password")).toBe(
      "  spaced  ",
    );
  });
});

describe("validateEmail", () => {
  it.each(["a@b.co", "first.last+tag@sub.domain.org"])("accepts %s", (value) => {
    expect(validateEmail(value)).toBeNull();
  });

  it("requires a value", () => {
    expect(validateEmail("")).toBe("emailRequired");
  });

  it.each(["nope", "no@domain", "no domain@x.co", "@b.co"])(
    "rejects %s",
    (value) => {
      expect(validateEmail(value)).toBe("emailInvalid");
    },
  );
});

describe("validatePassword", () => {
  it("requires a value", () => {
    expect(validatePassword("")).toBe("passwordRequired");
  });

  it("rejects one character short of the minimum", () => {
    expect(validatePassword("x".repeat(MIN_PASSWORD_LENGTH - 1))).toBe(
      "passwordTooShort",
    );
  });

  it("accepts exactly the minimum", () => {
    expect(validatePassword("x".repeat(MIN_PASSWORD_LENGTH))).toBeNull();
  });

  /**
   * The app's minimum has to be at least Supabase's, or the form accepts a
   * password the auth server then rejects and the user sees a generic failure
   * on a field that looked fine. `supabase/config.toml` sets 8 to match.
   */
  it("is at least as strict as the configured Supabase minimum", () => {
    expect(MIN_PASSWORD_LENGTH).toBeGreaterThanOrEqual(8);
  });
});

describe("validatePasswordConfirmation", () => {
  it("requires a confirmation", () => {
    expect(validatePasswordConfirmation("abcdefgh", "")).toBe(
      "passwordConfirmRequired",
    );
  });

  it("rejects a mismatch", () => {
    expect(validatePasswordConfirmation("abcdefgh", "abcdefgi")).toBe(
      "passwordMismatch",
    );
  });

  it("accepts a match", () => {
    expect(validatePasswordConfirmation("abcdefgh", "abcdefgh")).toBeNull();
  });
});

describe("validateDisplayName", () => {
  it("requires a value", () => {
    expect(validateDisplayName("")).toBe("displayNameRequired");
  });

  it("accepts exactly the maximum", () => {
    expect(validateDisplayName("x".repeat(MAX_DISPLAY_NAME_LENGTH))).toBeNull();
  });

  it("rejects one character over", () => {
    expect(validateDisplayName("x".repeat(MAX_DISPLAY_NAME_LENGTH + 1))).toBe(
      "displayNameTooLong",
    );
  });
});

/**
 * These parse straight from the Drizzle enums rather than a hand-copied list,
 * so the assertions are about the guard rejecting junk — not about which
 * values exist, which the schema already decides.
 */
describe("enum parsing", () => {
  it("accepts the schema's own values", () => {
    expect(parseExperienceLevel("beginner")).toBe("beginner");
    expect(parseLearningGoal("read_charts")).toBe("read_charts");
    expect(parseUserLocale("fr")).toBe("fr");
  });

  it.each(["", "BEGINNER", "expert", "'; drop table profile; --"])(
    "rejects %p as a level",
    (value) => {
      expect(parseExperienceLevel(value)).toBeNull();
    },
  );

  it("rejects a locale we do not publish in", () => {
    expect(parseUserLocale("de")).toBeNull();
  });

  it("rejects a goal that is not in the enum", () => {
    expect(parseLearningGoal("get_rich")).toBeNull();
  });
});

describe("collectErrors", () => {
  it("returns null when every rule passed", () => {
    expect(collectErrors({ email: null, password: null })).toBeNull();
  });

  it("drops the nulls and keeps the failures", () => {
    expect(collectErrors({ email: "emailInvalid", password: null })).toEqual({
      email: "emailInvalid",
    });
  });

  /**
   * A form with no rules at all must not report itself as failing — the
   * actions branch on `if (fieldErrors)`, so an empty object here would block
   * every submit.
   */
  it("returns null for an empty rule set", () => {
    expect(collectErrors({})).toBeNull();
  });
});
