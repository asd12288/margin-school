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
 * Phase 3's done-when for the public shell — "the shell must never blink" —
 * plus the fact that the header's only nav link actually goes somewhere.
 *
 * That second half is not incidental. The catalog (`/courses`, `/catalogue`)
 * arrived in task 12; before it, this link 404'd, and nothing in the suite
 * would have said so. Clicking the real link rather than calling
 * `page.goto("/en/courses")` is the point: it also covers `NavLink`'s
 * canonical-key `href` surviving `i18n/routing.ts`'s pathname translation.
 */
test("the public header's Courses link reaches the catalog, without blinking", async ({
  page,
}) => {
  await page.goto("/en");

  // Same stamp trick as the signed-in test below: if `(public)/layout.tsx`
  // remounts across the nav, the stamp is gone.
  await page.locator("header").evaluate((node) => {
    (node as HTMLElement).dataset.stamp = "kept";
  });

  await page.locator("header").getByRole("link", { name: "Courses" }).click();

  await expect(page).toHaveURL(/\/en\/courses$/);
  await expect(page.getByRole("heading", { level: 1, name: "Courses" })).toBeVisible();
  await expect(page.locator("header")).toHaveAttribute("data-stamp", "kept");
});

/**
 * The same done-when, for the signed-in app shell.
 *
 * `/learn` → `/my-courses` rather than the public header's own link: these
 * routes render `AppHeader`, a different component from `SiteHeader` with a
 * different nav and a different account slot, and the test above already
 * covers the public one. The assertion is identical — the header node's
 * identity survives a client-side nav.
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
 * `/learn` ↔ `/apprendre` is one of the translated-segment pairs in
 * `i18n/routing.ts` — the switcher has to rewrite the segment, not just the
 * locale prefix. Doing it from a signed-in route also proves the switch
 * survives the app shell's own layout, which the public pages don't exercise.
 *
 * `/learn` is also now the *only* place this is reachable from a header: the
 * public header dropped its locale switcher, which lives in the footer alone.
 *
 * Two clicks, not one. The switcher used to be a segmented ARIA radiogroup
 * whose options were always on screen; it is a `DropdownMenu` now, so the
 * options are `menuitemradio` — a distinct ARIA role, not `radio` — and they
 * do not exist in the DOM until the trigger is opened. The old one-liner
 * `getByRole("radio", …)` did not fail loudly when that changed, it simply
 * waited 30 seconds for an element that could never appear.
 */
test("switching locale keeps you on the same page, with translated segments", async ({
  page,
  signInAs,
}) => {
  await signInAs("student");
  await page.goto("/en/learn");

  await page.getByRole("button", { name: "Current language: English" }).click();
  await page.getByRole("menuitemradio", { name: "Français" }).click();

  // Not /fr/learn — the segment itself is translated.
  await expect(page).toHaveURL(/\/fr\/apprendre$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});

/**
 * The theme control is a two-state button now, not a three-option menu, and
 * its accessible name states the action rather than the current theme — so
 * the name itself is the assertion that it flipped.
 */
test("the theme button toggles between light and dark", async ({ page }) => {
  await page.goto("/en");

  const toDark = page.getByRole("button", { name: "Switch to dark theme" });
  await expect(toDark).toBeVisible();
  await toDark.click();

  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(
    page.getByRole("button", { name: "Switch to light theme" })
  ).toBeVisible();
});

/**
 * The public header carries one auth action, not the "Sign in" + "Start free
 * trial" pair — the auth screens switch between the two themselves. And the
 * footer must not reintroduce a second one: it previously rendered its own
 * "Sign in"/"Start free trial" column unconditionally, which pitched a free
 * trial to signed-in subscribers on every page.
 */
test("a signed-out visitor gets exactly one auth action on the page", async ({
  page,
}) => {
  await page.goto("/en");

  await expect(page.getByRole("link", { name: "Start free trial" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
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
