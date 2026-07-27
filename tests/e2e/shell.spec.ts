import { expect, test } from "./fixtures/session";

test("a signed-in visitor sees the account menu, not the trial CTA", async ({
  page,
  signInAs,
}) => {
  await signInAs("student");
  await page.goto("/en");

  await expect(page.getByRole("button", { name: "Your account" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start free trial" })).toHaveCount(0);
});

/**
 * Phase 3's done-when, stated literally — "the shell must never blink" on
 * navigation.
 *
 * The brief's own version of this test clicked the public header's
 * "Courses" link and expected `/en/courses` to render. That route does not
 * exist yet: the catalog is Phase 8 (see docs/roadmap.md and the home
 * page's own CTA, which deliberately points at `/design-system` instead —
 * `app/[locale]/(public)/page.tsx` says so directly — and
 * `.superpowers/sdd/task-9-report.md` documents the same 404 as expected).
 * Confirmed with `curl -I /en/courses` against a production build: 404, and
 * that 404 renders outside `(public)/layout.tsx` entirely, so there is no
 * second real page in the public shell to navigate to today — only the
 * signed-in app shell has two.
 *
 * This uses `/learn` → `/my-courses` instead: both are real, both render
 * `AppHeader`, and the assertion (the header node's identity survives a
 * client-side nav) is exactly the same one the brief intended.
 */
test("navigating does not re-render the navigation", async ({ page, signInAs }) => {
  await signInAs("student");
  await page.goto("/en/learn");

  // Stamp the live header node. If the layout remounts, the stamp is gone —
  // which is exactly the failure "the shell must never blink" describes.
  await page.locator("header").evaluate((node) => {
    (node as HTMLElement).dataset.stamp = "kept";
  });

  await page.getByRole("link", { name: "My courses" }).click();
  await expect(page).toHaveURL(/\/en\/my-courses$/);

  await expect(page.locator("header")).toHaveAttribute("data-stamp", "kept");
});

/**
 * Same substitution as above, and for the same reason: `/en/courses` 404s
 * because the catalog is Phase 8, so switching locale from there never
 * reaches a page with a `LocaleSwitcher` to click. `/learn` ↔ `/apprendre`
 * is one of the same translated-segment pairs (`i18n/routing.ts`) and is a
 * real, signed-in-reachable page today.
 */
test("switching locale keeps you on the same page, with translated segments", async ({
  page,
  signInAs,
}) => {
  await signInAs("student");
  await page.goto("/en/learn");

  await page.getByRole("radio", { name: "Français" }).click();

  // Not /fr/learn — the segment itself is translated.
  await expect(page).toHaveURL(/\/fr\/apprendre$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});

/**
 * `AppHeader` (task 8) was verified only by compilation until now — no test
 * ever loaded a signed-in `/learn` or `/my-courses` and looked at what
 * rendered. These do: a real navigation to each app route, checking the
 * header is actually there and that `NavLink`'s `aria-current="page"` lands
 * on the item that matches the route and nowhere else.
 */
test.describe("app header renders live for a signed-in student", () => {
  test("on /learn, with Learn marked current", async ({ page, signInAs }) => {
    await signInAs("student");
    await page.goto("/en/learn");

    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header.getByRole("link", { name: "Learn" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await expect(header.getByRole("link", { name: "My courses" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  test("on /my-courses, with My courses marked current", async ({ page, signInAs }) => {
    await signInAs("student");
    await page.goto("/en/my-courses");

    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header.getByRole("link", { name: "My courses" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await expect(header.getByRole("link", { name: "Learn" })).not.toHaveAttribute(
      "aria-current"
    );
  });
});

/**
 * `AppHeader`'s nav carries more items than the public header's but shares
 * the same non-wrapping flex row and fixed-width account skeleton, and had
 * never been rendered at a narrow viewport. `playwright.config.ts` already
 * runs every spec under a `mobile` project (Pixel 7, 412px wide) as well as
 * `desktop`, so this test does not set its own viewport — it relies on that
 * project matrix to exercise the narrow case, the same way
 * `design-system.spec.ts`'s "never scrolls horizontally" check does.
 *
 * This did not "come free": it caught a real bug. `AppHeader`'s Suspense
 * fallback reused the public header's `AccountSlotSkeleton` (`w-56`, 224px —
 * sized for the signed-out "Sign in" + "Start free trial" pair). The app and
 * admin shells sit behind `requireProfile()`/`requireRole()`, so that pair
 * can never be what resolves there — only `AccountMenu`'s `size-8` trigger
 * can. Reserving 224px for content that never arrives, on top of
 * `AppHeader`'s extra nav item, overflowed the non-wrapping header row at
 * 412px during the brief moment before the account slot resolves. Fixed by
 * giving `AppHeader` its own correctly-sized fallback,
 * `AccountMenuSkeleton` (`components/margin/shell/account-slot.tsx`), rather
 * than by loosening this assertion.
 */
test("app header does not overflow horizontally, signed in", async ({ page, signInAs }) => {
  await signInAs("student");
  await page.goto("/en/learn");

  await expect(page.locator("header")).toBeVisible();

  const overflows = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    return document.documentElement.scrollWidth > vw + 1;
  });
  expect(overflows).toBe(false);
});
