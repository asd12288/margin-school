import { describe, expect, it } from "vitest";

import {
  canonicalPathFromRewrite,
  matchesPrefix,
  PROTECTED_PREFIXES,
  stripLocale,
} from "@/lib/auth/routes";

const LOCALES = ["fr", "en"] as const;

describe("canonicalPathFromRewrite", () => {
  it("prefers the rewrite target when next-intl translated the URL", () => {
    expect(
      canonicalPathFromRewrite("http://localhost:3000/fr/account", "/fr/compte")
    ).toBe("/fr/account");
  });

  it("falls back to the request path when there is no rewrite", () => {
    expect(canonicalPathFromRewrite(null, "/en/account")).toBe("/en/account");
  });

  it("accepts a bare path as the rewrite value", () => {
    expect(canonicalPathFromRewrite("/fr/learn", "/fr/apprendre")).toBe("/fr/learn");
  });

  it("falls back when the rewrite value is unparseable", () => {
    expect(canonicalPathFromRewrite("not a url", "/fr/compte")).toBe("/fr/compte");
  });
});

describe("protected routes, in both locales", () => {
  it("matches a French URL once resolved to canonical", () => {
    const canonical = canonicalPathFromRewrite(
      "http://localhost:3000/fr/account",
      "/fr/compte"
    );
    expect(matchesPrefix(stripLocale(canonical, LOCALES), PROTECTED_PREFIXES)).toBe(true);
  });

  it("matches the English URL with no rewrite at all", () => {
    const canonical = canonicalPathFromRewrite(null, "/en/account");
    expect(matchesPrefix(stripLocale(canonical, LOCALES), PROTECTED_PREFIXES)).toBe(true);
  });

  it("leaves public routes alone", () => {
    expect(matchesPrefix(stripLocale("/fr/catalogue", LOCALES), PROTECTED_PREFIXES)).toBe(false);
  });
});
