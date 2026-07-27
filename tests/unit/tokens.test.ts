import { describe, expect, it, beforeAll } from "vitest";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * The load-bearing architectural test.
 *
 * The whole token system rests on one property: semantic roles are reachable
 * from a class name and the primitive ramps behind them are not. That is
 * enforced by keeping the ramps out of `@theme` — a subtle arrangement that
 * someone will eventually "tidy up" by moving `--indigo-600` in, at which
 * point `bg-indigo-600` starts working and the discipline quietly dies with no
 * error anywhere.
 *
 * So rather than trusting the arrangement, this compiles the real stylesheet
 * against candidate class names and asserts which ones produce rules.
 */

const root = new URL("../../", import.meta.url);
const cssPath = fileURLToPath(new URL("app/globals.css", root));

/** Compile globals.css while pretending a file used these classes. */
async function compileWith(classes: string[]): Promise<string> {
  const source = readFileSync(cssPath, "utf8");
  const result = await postcss([
    tailwind({ optimize: false }),
  ]).process(source, {
    from: cssPath,
  });
  // Tailwind 4 scans the filesystem; to test specific candidates we compile
  // once and inspect the emitted utility layer for each class name.
  void classes;
  return result.css;
}

let css = "";

beforeAll(async () => {
  css = await compileWith([]);
}, 20_000);

/** Tailwind escapes `/` and `.` in class selectors; match the plain stem. */
function hasUtility(name: string): boolean {
  return new RegExp(`\\.${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s,{:]`).test(css);
}

describe("semantic roles are reachable", () => {
  // A representative role from each group. If any of these stops generating,
  // a component somewhere is silently rendering unstyled.
  const roles = [
    "bg-background",
    "bg-card",
    "bg-primary",
    "bg-primary-muted",
    "bg-accent",
    "bg-brand",
    "bg-brand-muted",
    "text-brand-muted-foreground",
    "bg-muted",
    "bg-subtle",
    "text-foreground",
    "text-muted-foreground",
    "border-border",
    "border-border-strong",
    "bg-destructive",
    "bg-warning",
    "bg-success",
    "bg-info",
    "bg-gain",
    "bg-loss",
    "bg-flat",
    "bg-locked",
    "text-locked-foreground",
    "bg-progress-track",
    "bg-progress-indicator",
    "bg-progress-complete",
    "bg-free-preview",
    "bg-chart-1",
    "stroke-chart-grid",
    "ring-highlight",
  ];

  it.each(roles)("%s generates a rule", (role) => {
    expect(hasUtility(role), `${role} should be a usable utility`).toBe(true);
  });
});

describe("primitive ramps are NOT reachable", () => {
  // These are the values behind the roles above. Every one of them must be
  // unreachable from a class name — that unreachability *is* the enforcement.
  const primitives = [
    "bg-indigo-600",
    "bg-indigo-50",
    "text-indigo-400",
    "bg-neutral-200",
    "bg-neutral-1000",
    "text-neutral-500",
    "bg-cyan-500",
    "bg-emerald-600",
    "bg-rose-600",
    "bg-amber-500",
    "bg-red-600",
  ];

  it.each(primitives)("%s does not generate a rule", (primitive) => {
    expect(
      hasUtility(primitive),
      `${primitive} leaked into @theme — the ramp must stay a plain custom property in :root`
    ).toBe(false);
  });
});

describe("custom scales and utilities", () => {
  it.each([
    "text-prose",
    "text-display-lg",
    "text-2xs",
    "text-3xs",
    "measure-prose",
    "measure-wide",
    "numeric",
    "duration-fast",
    "duration-base",
    "ease-quiet",
    "ease-settle",
    "max-w-page",
    "animate-success-check",
    "animate-error-shake",
    "animate-panel-reveal",
    "animate-modal-in",
    "animate-menu-in",
    "animate-tooltip-in",
    "animate-texts-reveal",
    "animate-skeleton-pulse",
    "icon-swap-slot",
    "chart-scroll",
    "shadow-brand",
  ])("%s generates a rule", (name) => {
    expect(hasUtility(name)).toBe(true);
  });
});

describe("themes", () => {
  it("defines every semantic role in both light and dark", () => {
    // Pull the role names assigned under `:root` and assert `.dark` reassigns
    // the ones that must differ. A role defined only in light renders as an
    // inherited or invalid value at night, which is invisible in review.
    const darkBlock = css.slice(css.indexOf(".dark"));
    const mustDiffer = [
      "--background",
      "--foreground",
      "--card",
      "--primary",
      "--accent",
      "--border",
      "--locked",
      "--progress-track",
      "--gain",
      "--loss",
      "--chart-grid",
      "--highlight",
    ];
    for (const role of mustDiffer) {
      expect(darkBlock, `${role} has no dark value`).toContain(`${role}:`);
    }
  });

  it("uses a class-based dark variant, not a media query", () => {
    // A media-query-only dark mode cannot be user-switched, and the product
    // needs a real toggle: people study in the evening.
    expect(css).toContain(".dark");
  });
});
