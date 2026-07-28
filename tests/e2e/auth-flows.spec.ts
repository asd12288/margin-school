import { expect, test } from "./fixtures/session";

/**
 * The form's own error/notice banner.
 *
 * Not `getByRole("alert")`: Next renders a `role="alert"` route announcer on
 * every page, so the role matches two elements and Playwright's strict mode
 * fails before it compares any text.
 */
const FORM_MESSAGE = '[data-slot="form-message"]';

/**
 * The Phase 4 gates, end to end.
 *
 * `auth-routing.spec.ts` covers the proxy's optimistic redirects — the cookie
 * check that runs before anything renders. This file covers the checks the
 * proxy *cannot* make, because they need the database: whether onboarding is
 * finished, and what role the person has.
 */

test.describe("onboarding blocks", () => {
  test("sends a signed-in visitor who has not onboarded to onboarding", async ({
    page,
    signInAs,
  }) => {
    await signInAs("newcomer");
    await page.goto("/en/learn");

    // The proxy let them through — they have a valid session — and
    // `requireOnboardedProfile()` in the page bounced them. That is the whole
    // point of the gate living in the DAL rather than the proxy.
    await expect(page).toHaveURL(/\/en\/onboarding$/);
  });

  test("keeps them out of my-courses and account too", async ({ page, signInAs }) => {
    await signInAs("newcomer");

    for (const route of ["/en/my-courses", "/en/account"]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/en\/onboarding$/);
    }
  });

  test("lets a visitor who has onboarded straight through", async ({
    page,
    signInAs,
  }) => {
    await signInAs("student");
    await page.goto("/en/learn");

    await expect(page).toHaveURL(/\/en\/learn$/);
  });

  test("does not trap a visitor who has already onboarded on the form", async ({
    page,
    signInAs,
  }) => {
    await signInAs("student");
    await page.goto("/en/onboarding");

    // Without the check in the page, this is a form that rewrites answers the
    // person already gave and cannot be dismissed.
    await expect(page).toHaveURL(/\/en\/learn$/);
  });
});

test.describe("roles", () => {
  test("admits an admin to /admin", async ({ page, signInAs }) => {
    await signInAs("admin");
    await page.goto("/en/admin");

    await expect(page).toHaveURL(/\/en\/admin$/);
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
  });

  test("shows a staff badge on the account page, and none for a student", async ({
    page,
    signInAs,
  }) => {
    await signInAs("editor");
    await page.goto("/en/account");
    await expect(page.getByText("Editor", { exact: true })).toBeVisible();

    await signInAs("student");
    await page.goto("/en/account");
    await expect(page.getByText("Student", { exact: true })).toHaveCount(0);
  });
});

test.describe("password reset", () => {
  test("a signed-out visitor cannot reach the new-password form", async ({ page }) => {
    await page.goto("/en/reset-password");

    // There is nothing to reset without a session — the recovery link is what
    // creates one, via /auth/confirm.
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  test("/auth/confirm without a token lands on sign-in and says why", async ({
    page,
  }) => {
    await page.goto("/auth/confirm");

    await expect(page).toHaveURL(/\/fr\/connexion\?error=linkInvalid$/);
    await expect(page.locator(FORM_MESSAGE)).toContainText("lien");
  });

  test("/auth/callback without a code says the Google hop failed", async ({ page }) => {
    await page.goto("/auth/callback?locale=en");

    await expect(page).toHaveURL(/\/en\/sign-in\?error=oauthFailed$/);
    await expect(page.locator(FORM_MESSAGE)).toBeVisible();
  });

  test("an unrecognised ?error= renders nothing rather than itself", async ({
    page,
  }) => {
    await page.goto("/en/sign-in?error=<script>alert(1)</script>");

    await expect(page.locator(FORM_MESSAGE)).toHaveCount(0);
  });
});

test.describe("sign-in form", () => {
  test("rejects a wrong password without saying whether the account exists", async ({
    page,
  }) => {
    await page.goto("/en/sign-in");

    await page.getByLabel("Email").fill("student@test.local");
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    const alert = page.locator(FORM_MESSAGE);
    await expect(alert).toBeVisible();

    // One message for "no such account" and for "wrong password". A different
    // message per case would turn this form into a membership oracle.
    await expect(alert).toContainText("do not match an account");
  });

  test("signs in and lands on /learn", async ({ page }) => {
    await page.goto("/en/sign-in");

    await page.getByLabel("Email").fill("student@test.local");
    await page.getByLabel("Password").fill("test-password-123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/en\/learn$/);
  });

  test("returns to where the visitor was going", async ({ page }) => {
    // The proxy sets this when it bounces someone off a protected route.
    await page.goto("/en/sign-in?next=%2Fen%2Fmy-courses");

    await page.getByLabel("Email").fill("student@test.local");
    await page.getByLabel("Password").fill("test-password-123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/en\/my-courses$/);
  });
});
