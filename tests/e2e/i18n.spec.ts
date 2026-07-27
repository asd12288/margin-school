import { expect, test } from "@playwright/test";

/**
 * Locale routing.
 *
 * docs/content-model.md rule 4: URLs carry the locale, with correct `hreflang`,
 * because SEO is the acquisition channel and cookie-based switching would give
 * Google one URL for two languages.
 */

test("redirects a bare path to a locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(fr|en)$/);
});

test("serves French at /fr and announces it", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  // Real translated copy, not a key and not the English fallback.
  await expect(
    page.getByText("Vous n'avez encore rien commencé")
  ).toBeVisible();
});

test("serves English at /en and announces it", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByText("You have not started anything yet")
  ).toBeVisible();
});

test("404s an unknown locale rather than falling back", async ({ page }) => {
  // Silently rendering `/de/…` in French would hand Google a page whose `lang`
  // attribute lies about its content.
  const response = await page.goto("/de");
  expect(response?.status()).toBe(404);
});

test("keeps the locale when following an internal link", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("link", { name: "Browse the catalog" }).click();
  // The locale-aware `Link` carries `/en` through; a bare `next/link` would
  // drop the reader onto the default locale.
  await expect(page).toHaveURL(/\/en\/design-system$/);
});
