import { expect, test } from "./fixtures/session";

test.describe("protected routes", () => {
  test("sends a signed-out visitor to sign-in, in English", async ({ page }) => {
    await page.goto("/en/learn");
    await expect(page).toHaveURL(/\/en\/sign-in\?next=%2Fen%2Flearn$/);
  });

  /**
   * The one that matters. next-intl rewrites /fr/apprendre to /fr/learn
   * internally; if the proxy matches the raw pathname, this route silently
   * stops being protected — for French users only.
   */
  test("sends a signed-out visitor to sign-in, in French", async ({ page }) => {
    await page.goto("/fr/apprendre");
    await expect(page).toHaveURL(/\/fr\/connexion\?next=%2Ffr%2Fapprendre$/);
  });

  test("lets a signed-in student through", async ({ page, signInAs }) => {
    await signInAs("student");
    await page.goto("/en/learn");
    await expect(page).toHaveURL(/\/en\/learn$/);
    await expect(page.getByRole("heading", { name: "Your next step" })).toBeVisible();
  });
});

test.describe("staff routes", () => {
  /**
   * The security-relevant path in the whole branch. Task 5 built the role
   * gate, task 9 established that `requireRole` produces a 404 body — but
   * neither was ever exercised with a real signed-in session before this.
   *
   * The response's HTTP status is 200, not 404: `requireRole` calls
   * `notFound()` from inside `AdminFrame`, which is streamed in under a
   * `<Suspense>` boundary after the outer shell has already sent its 200.
   * That is documented behaviour (see admin/page.tsx and dal.ts), so this
   * asserts the rendered body — the same generic not-found page a plain
   * unmatched URL renders — rather than a status code that would not tell
   * the difference between the app's designed 404 and a broken route.
   */
  test("404s for a student, and does not admit that /admin exists", async ({
    page,
    signInAs,
  }) => {
    await signInAs("student");
    await page.goto("/en/admin");

    await expect(page.getByText("This page does not exist")).toBeVisible();
    await expect(page.getByText(/permission|forbidden|admin/i)).toHaveCount(0);
  });

  test("admits an editor", async ({ page, signInAs }) => {
    await signInAs("editor");
    await page.goto("/en/admin");

    await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
  });
});

test("a signed-in visitor is bounced away from sign-in", async ({ page, signInAs }) => {
  await signInAs("student");
  await page.goto("/en/sign-in");
  await expect(page).toHaveURL(/\/en\/learn$/);
});
