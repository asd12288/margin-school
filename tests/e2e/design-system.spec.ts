import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * The design system's own regression suite.
 *
 * It runs against a production build (see playwright.config.ts) because that is
 * what ships: `next dev` orders CSS differently and keeps the dev overlay in
 * the tree, both of which change what an accessibility scan sees.
 */

const ROUTE = "/design-system";

/**
 * Wait for every running animation to settle.
 *
 * Without this the accessibility scan races the entrance animations and
 * measures half-faded elements: `animate-texts-reveal` staggers the lesson
 * header in from `opacity: 0`, so axe reported the brand eyebrow at #9e5cea
 * against a token that is considerably darker, and flagged five contrast
 * violations that do not exist once the page is at rest.
 *
 * Worth being precise about, because the tempting fix is to darken the
 * palette until the scan goes quiet — which would make the design worse to
 * satisfy a measurement error.
 */
async function settleAnimations(page: Page) {
  await page.evaluate(async () => {
    // Only finite ones. `animate-skeleton-pulse` loops forever by design, and
    // its `finished` promise never resolves — awaiting the unfiltered list
    // hangs until the test times out.
    const finite = document.getAnimations().filter((a) => {
      const timing = a.effect?.getTiming();
      return timing ? timing.iterations !== Infinity : true;
    });
    await Promise.all(finite.map((a) => a.finished.catch(() => undefined)));
  });
}

async function setTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate((t) => {
    localStorage.setItem("theme", t);
  }, theme);
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.classList.contains("dark"))
    )
    .toBe(theme === "dark");
}

test.describe("design system page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE);
  });

  test("renders every section without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto(ROUTE);
    await expect(page.getByRole("heading", { name: "Design system" })).toBeVisible();

    for (const id of [
      "colour",
      "typography",
      "motion",
      "catalog",
      "curriculum",
      "lesson",
      "states",
      "loading",
    ]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }

    // next-themes injects a pre-paint script that React 19 warns about in dev.
    // It must not appear in a production build.
    expect(errors).toEqual([]);
  });

  test("switches theme and keeps it", async ({ page }) => {
    await setTheme(page, "dark");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await setTheme(page, "light");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("never scrolls horizontally", async ({ page }) => {
    // The single most common responsive defect, and invisible in a screenshot
    // taken at the wrong width.
    const overflows = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      return document.documentElement.scrollWidth > vw + 1;
    });
    expect(overflows).toBe(false);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`has no serious accessibility violations in ${theme}`, async ({ page }) => {
      await setTheme(page, theme);
      await settleAnimations(page);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const serious = results.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? "")
      );
      expect(
        serious.map((v) => `${v.id}: ${v.nodes.length} node(s) — ${v.help}`)
      ).toEqual([]);
    });
  }
});

test.describe("tabs", () => {
  test("slides the indicator to the active trigger", async ({ page }) => {
    await page.goto(ROUTE);

    const indicator = page.locator('[data-slot="tabs-indicator"]').first();
    const triggers = page.locator('[data-slot="tabs-trigger"]');

    // First paint must land on the active trigger without animating in.
    await expect(indicator).toHaveAttribute("data-animate", "true");
    const first = await indicator.evaluate((el) => (el as HTMLElement).style.transform);

    await triggers.nth(2).click();

    // The indicator ends up on the newly active trigger, measured against the
    // trigger's own box rather than a hardcoded pixel value.
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const ind = document.querySelector<HTMLElement>(
            '[data-slot="tabs-indicator"]'
          )!;
          const active = document.querySelector<HTMLElement>(
            '[data-slot="tabs-trigger"][data-state="active"]'
          )!;
          return (
            ind.style.transform === `translateX(${active.offsetLeft}px)` &&
            ind.style.width === `${active.offsetWidth}px`
          );
        })
      )
      .toBe(true);

    const moved = await indicator.evaluate((el) => (el as HTMLElement).style.transform);
    expect(moved).not.toBe(first);
  });
});
