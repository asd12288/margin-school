import { expect, test } from "@playwright/test";

import { extractConfirmUrl, waitForEmail } from "./fixtures/mail";

/**
 * The whole paths, start to finish, driven only through the UI.
 *
 * `auth-flows.spec.ts` checks the gates one redirect at a time using a seeded
 * session. This file uses no fixtures and no seeded users: every test signs up
 * its own account through the form and lives with whatever the product does
 * next. That is what makes it able to catch a break *between* two steps that
 * both pass in isolation.
 *
 * Each test owns a unique address, so they can run in parallel against one
 * shared inbox and one shared database without seeing each other's state.
 */

const PASSWORD = "test-password-123";
const NEW_PASSWORD = "test-password-456";

/** Unique per call, so parallel workers never collide on an account. */
function freshEmail(label: string) {
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `journey-${label}-${unique}@test.local`;
}

const FORM_MESSAGE = '[data-slot="form-message"]';

/**
 * Start every test with the consent choice already made.
 *
 * The banner is fixed to the bottom of the viewport, and on a phone it is tall
 * enough to sit over the last element on the page — the sign-out button at the
 * foot of onboarding, the delete-account field at the foot of the account
 * page. Playwright scrolls to a target but a fixed overlay still intercepts
 * the click, so those two tests failed on mobile only.
 *
 * Answering it up front is what a real visitor does, and it keeps these tests
 * about auth rather than about the banner. `denied` rather than `granted`:
 * these tests have no business loading PostHog.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("ms-analytics-consent", "denied");
  });
});

/**
 * Clicks a choice card by its visible label.
 *
 * Not `getByRole("radio").check()`. The input is `sr-only` — 1px, behind the
 * card — so Playwright's actionability check finds the `<label>` intercepting
 * pointer events and retries until it times out. Clicking the card is also
 * what a person actually does; the input exists to be focusable and to carry
 * the value, not to be aimed at.
 *
 * Anchored to the whole label text so one option cannot match another's card.
 */
function chooseCard(page: import("@playwright/test").Page, label: string) {
  return page
    .locator("label")
    .filter({ hasText: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) })
    .click();
}

/**
 * Sign out and wait for the landing page.
 *
 * Same reason `completeOnboarding` waits: sign-out is a server redirect, so a
 * caller that navigated immediately afterwards was racing it and would
 * intermittently run the next step on the wrong page.
 */
async function signOut(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/en$/);
}

/** Sign-up through the form, landing on onboarding. */
async function signUp(page: import("@playwright/test").Page, email: string) {
  await page.goto("/en/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/en\/onboarding$/);
}

/**
 * Answer the four questions and land in the app.
 *
 * Waits for the landing URL before returning, and that is not decoration: the
 * submit triggers a server redirect, so a caller that went straight to
 * `page.goto(...)` was racing an in-flight navigation and sometimes ended up
 * on `/learn` instead of wherever it asked for. The symptom was a locator
 * timing out on a page that looked fine in the trace.
 */
async function completeOnboarding(
  page: import("@playwright/test").Page,
  { name = "Camille", locale = "en" } = {},
) {
  await page.getByLabel("What should we call you?").fill(name);
  await chooseCard(page, locale === "en" ? "English" : "Français");
  await chooseCard(page, "I am starting from scratch");
  await chooseCard(page, "Learn to read a chart");
  await page.getByRole("button", { name: "Start learning" }).click();

  await expect(page).toHaveURL(locale === "en" ? /\/en\/learn$/ : /\/fr\/apprendre$/);
}

test.describe("a new account, end to end", () => {
  test("sign up, onboard, and arrive in the app with the answers kept", async ({
    page,
  }) => {
    const email = freshEmail("signup");

    await signUp(page, email);
    await completeOnboarding(page, { name: "Camille" });

    // The answers survived the write — the account page reads them back.
    await page.goto("/en/account");
    await expect(page.getByLabel("Name")).toHaveValue("Camille");
    await expect(
      page.getByRole("radio", { name: "I am starting from scratch" }),
    ).toBeChecked();
    await expect(page.getByRole("radio", { name: "Learn to read a chart" })).toBeChecked();
    await expect(page.getByText(email)).toBeVisible();
  });

  test("choosing French on the form lands in French", async ({ page }) => {
    await signUp(page, freshEmail("locale"));
    // The helper asserts the landing URL. Reaching `/fr/apprendre` at all is
    // the point here: the redirect uses the language just chosen, not the one
    // the form was rendered in, which is the only way the choice is visible
    // immediately.
    await completeOnboarding(page, { locale: "fr" });
  });

  test("refuses to finish with the questions unanswered", async ({ page }) => {
    await signUp(page, freshEmail("invalid"));

    await page.getByRole("button", { name: "Start learning" }).click();

    // Still here, and told what is missing.
    await expect(page).toHaveURL(/\/en\/onboarding$/);
    await expect(page.getByText("Tell us what to call you.")).toBeVisible();
    await expect(page.getByText("Pick the one closest to you.")).toBeVisible();
    await expect(page.getByText("Pick what you are here for.")).toBeVisible();
  });

  test("offers a way out of the blocking screen", async ({ page }) => {
    await signUp(page, freshEmail("escape"));

    // Onboarding blocks every other signed-in route and carries no
    // navigation. Without this the only exit is guessing that the public
    // site's account menu has one.
    await page.getByRole("button", { name: "Sign out" }).click();

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole("link", { name: "Start free trial" })).toBeVisible();
  });
});

test.describe("the consent banner", () => {
  /**
   * The banner is fixed to the bottom, so it covers whatever the page ends
   * with — and a fixed overlay intercepts the pointer wherever you scroll it
   * to, so the element is reachable and still unclickable. At 375px, where the
   * message wraps and the buttons drop onto their own row, that was the
   * sign-out button at the foot of onboarding.
   *
   * The other tests here answer the banner up front, which is what a visitor
   * does and what keeps them about auth. This one deliberately leaves it
   * unanswered, because that is the only state in which the bug exists.
   */
  test("does not cover the end of the page", async ({ page }) => {
    // Undoes the `beforeEach` above. Init scripts run in registration order,
    // so this one wins.
    await page.addInitScript(() => {
      window.localStorage.removeItem("ms-analytics-consent");
    });

    await signUp(page, freshEmail("banner"));
    await expect(page.getByRole("dialog")).toBeVisible();

    // The page reserves exactly the banner's measured height, so nothing ends
    // up underneath it. Measured rather than hardcoded because the height
    // changes with viewport width and with locale.
    const { reserved, bannerHeight } = await page.evaluate(() => ({
      reserved: parseFloat(getComputedStyle(document.body).paddingBottom),
      bannerHeight:
        document.querySelector('[role="dialog"]')?.clientHeight ?? 0,
    }));

    expect(bannerHeight).toBeGreaterThan(0);
    expect(reserved).toBeGreaterThanOrEqual(bannerHeight);

    // The real assertion: the click lands. Before the fix this timed out,
    // because the banner was on top of the button.
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/en$/);
  });

  test("gives the space back once answered", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("ms-analytics-consent");
    });

    await page.goto("/en");
    await page.getByRole("button", { name: "Decline" }).click();

    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Leaving the reservation in place would keep a strip of empty space at
    // the bottom of every page for the rest of the session.
    await expect
      .poll(() =>
        page.evaluate(() =>
          parseFloat(getComputedStyle(document.body).paddingBottom),
        ),
      )
      .toBe(0);
  });
});

test.describe("password reset, through the actual email", () => {
  test("request a link, follow it, set a new password, sign in with it", async ({
    page,
  }) => {
    const email = freshEmail("reset");

    await signUp(page, email);
    await completeOnboarding(page);
    await page.goto("/en/account");
    await signOut(page);

    // 1. Ask for the link.
    await page.goto("/en/forgot-password");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send the link" }).click();

    // The notice is identical whether or not the address has an account —
    // anything else makes this form a membership oracle.
    await expect(page.locator(FORM_MESSAGE)).toContainText("a reset link is on its way");

    // 2. Open what actually arrived. `extractConfirmUrl` fails loudly if the
    //    template regressed to Supabase's default, which links somewhere this
    //    app cannot complete.
    const mail = await waitForEmail(email);
    await page.goto(extractConfirmUrl(mail.body));

    // 3. /auth/confirm traded the token for a session and sent us on.
    await expect(page).toHaveURL(/\/en\/reset-password$/);

    await page.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel("Confirm new password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Save the new password" }).click();

    await expect(page).toHaveURL(/\/en\/learn$/);

    // 4. The new password is the one that works now.
    await page.goto("/en/account");
    await signOut(page);

    await page.goto("/en/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/en\/learn$/);
  });

  test("a recovery link cannot be used twice", async ({ page }) => {
    const email = freshEmail("reused");

    await signUp(page, email);
    await completeOnboarding(page);
    await page.goto("/en/account");
    await signOut(page);

    await page.goto("/en/forgot-password");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send the link" }).click();
    await expect(page.locator(FORM_MESSAGE)).toBeVisible();

    const link = extractConfirmUrl((await waitForEmail(email)).body);

    await page.goto(link);
    await expect(page).toHaveURL(/\/en\/reset-password$/);

    // Sign out so the second visit is not merely riding the session the first
    // one created — this asserts the *token* is spent, not the cookie.
    await page.goto("/en/account");
    await signOut(page);

    await page.goto(link);
    await expect(page).toHaveURL(/\/en\/sign-in\?error=linkExpired$/);
    await expect(page.locator(FORM_MESSAGE)).toContainText("expired or was already used");
  });
});

test.describe("account", () => {
  test("switching language moves the page to the other language's URL", async ({
    page,
  }) => {
    await signUp(page, freshEmail("lang"));
    await completeOnboarding(page);

    await page.goto("/en/account");
    await chooseCard(page, "Français");
    await page.getByRole("button", { name: "Save changes" }).click();

    // The account page's own URL is language-dependent, so staying put would
    // leave the reader on the English URL of a French page.
    await expect(page).toHaveURL(/\/fr\/compte$/);
    // `level: 1`, because "Compte" also matches the "Supprimer votre compte"
    // heading further down and an ambiguous locator is a strict-mode failure.
    await expect(
      page.getByRole("heading", { level: 1, name: "Compte", exact: true }),
    ).toBeVisible();
  });

  test("changing the password requires the current one", async ({ page }) => {
    await signUp(page, freshEmail("pw"));
    await completeOnboarding(page);
    await page.goto("/en/account");

    await page.getByLabel("Current password").fill("not-my-password");
    await page.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel("Confirm new password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Change password" }).click();

    await expect(page.getByText("That is not your current password.")).toBeVisible();
  });

  test("changing the password works, and the new one is what signs you in", async ({
    page,
  }) => {
    const email = freshEmail("pwok");

    await signUp(page, email);
    await completeOnboarding(page);
    await page.goto("/en/account");

    await page.getByLabel("Current password").fill(PASSWORD);
    await page.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel("Confirm new password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Change password" }).click();

    // The action redirects back here with `?changed=password`, which is what
    // renders this. It used to return a notice instead, and under parallel
    // load that never arrived — the button sat on its spinner forever while
    // the change had already succeeded. This assertion is what caught it.
    await expect(page).toHaveURL(/\/en\/account\?changed=password$/);
    await expect(page.locator(FORM_MESSAGE)).toContainText("password has been changed");

    await signOut(page);
    await page.goto("/en/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/en\/learn$/);
  });

  test("deleting the account needs the confirmation word and then really deletes", async ({
    page,
  }) => {
    const email = freshEmail("delete");

    await signUp(page, email);
    await completeOnboarding(page);
    await page.goto("/en/account");

    // Wrong word: nothing happens.
    await page.getByLabel("Type DELETE to confirm").fill("delete me");
    await page.getByRole("button", { name: "Delete my account permanently" }).click();
    await expect(page.getByText("The word does not match.")).toBeVisible();

    await page.getByLabel("Type DELETE to confirm").fill("DELETE");
    await page.getByRole("button", { name: "Delete my account permanently" }).click();

    // Signed out and back on the public site.
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole("link", { name: "Start free trial" })).toBeVisible();

    // The account is gone, not merely signed out — the old credentials no
    // longer authenticate.
    await page.goto("/en/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.locator(FORM_MESSAGE)).toContainText("do not match an account");
  });
});

test.describe("the account menu", () => {
  test("opens, and signs out", async ({ page }) => {
    await signUp(page, freshEmail("menu"));
    await completeOnboarding(page);

    await page.goto("/en/learn");
    await page.getByRole("button", { name: "Your account" }).click();

    // A menu that will not open is invisible to every other test here, since
    // they all reach sign-out via the account page instead.
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Account" })).toBeVisible();

    // Sign-out is a submit button in its own form, not a `DropdownMenuItem`:
    // Radix's item preventDefaults the click to close the menu, which cancels
    // the submit. This is the assertion that catches that regression.
    await page.getByRole("menu").getByRole("button", { name: "Sign out" }).click();

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole("link", { name: "Start free trial" })).toBeVisible();
  });

  test("shows the admin link only to staff", async ({ page }) => {
    await signUp(page, freshEmail("nostaff"));
    await completeOnboarding(page);

    await page.goto("/en/learn");
    await page.getByRole("button", { name: "Your account" }).click();

    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Admin" })).toHaveCount(0);
  });
});
