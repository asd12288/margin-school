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
