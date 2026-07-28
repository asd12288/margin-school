import { describe, expect, it } from "vitest";

import { routing } from "@/i18n/routing";

/**
 * The pathnames map is the URL contract. Two things can go wrong silently:
 * a route that exists in one locale and not the other, and two different
 * routes that resolve to the same URL in one locale.
 *
 * The second is not hypothetical. English separates the catalog from a course
 * by plural — /courses vs /course/[course]. French `cours` is invariable, so
 * the literal translation puts a course and a category on the same shape and
 * the router cannot tell them apart. Hence `catalogue` for browsing.
 */
const { pathnames, locales } = routing;

function urlFor(route: string, locale: string): string {
  const value = pathnames[route as keyof typeof pathnames];
  return typeof value === "string" ? value : value[locale as "fr" | "en"];
}

/**
 * Placeholder *names* are not what makes two routes collide — shapes are.
 * `/cours/[course]` and `/cours/[...category]` are different strings occupying
 * one URL space: `/fr/cours/economics` could be either. Normalising every
 * dynamic segment to a single token is what lets the check see that.
 */
function shape(url: string): string {
  return url
    .split("/")
    .map((part) => (part.startsWith("[") ? "*" : part))
    .join("/");
}

describe("pathnames", () => {
  it("defines every route in every locale", () => {
    for (const route of Object.keys(pathnames)) {
      for (const locale of locales) {
        expect(urlFor(route, locale), `${route} in ${locale}`).toMatch(/^\//);
      }
    }
  });

  it("never maps two routes to the same URL shape within a locale", () => {
    for (const locale of locales) {
      const seen = new Map<string, string>();

      for (const route of Object.keys(pathnames)) {
        const url = shape(urlFor(route, locale));
        const collision = seen.get(url);
        expect(
          collision,
          `${route} and ${collision} both resolve to ${url} in ${locale}`
        ).toBeUndefined();
        seen.set(url, route);
      }
    }
  });

  it("would catch the collision a literal French translation creates", () => {
    // Guards the guard. `cours` is invariable, so translating both
    // /courses/[...category] and /course/[course] literally puts them in one
    // URL space — the regression the map's naming exists to prevent.
    expect(shape("/cours/[...category]")).toBe(shape("/cours/[course]"));
  });

  it("keeps dynamic segments identical across locales", () => {
    const segments = (url: string) =>
      url.split("/").filter((part) => part.startsWith("["));

    for (const route of Object.keys(pathnames)) {
      const fr = segments(urlFor(route, "fr"));
      const en = segments(urlFor(route, "en"));
      expect(fr, `${route} segment names`).toEqual(en);
    }
  });

  it("translates the French catalog and course routes", () => {
    expect(urlFor("/courses", "fr")).toBe("/catalogue");
    expect(urlFor("/course/[course]", "fr")).toBe("/cours/[course]");
    expect(urlFor("/learn", "fr")).toBe("/apprendre");
    expect(urlFor("/account", "fr")).toBe("/compte");
  });
});
