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

test.describe("404s an unknown locale rather than falling back", () => {
  // `/de/…` carries no recognised locale, so the middleware redirect that
  // adds a prefix negotiates one from `Accept-Language` — same as the bare
  // `/` redirect above. Pinning the browser's locale to French makes that
  // negotiation land on `/fr/de/…` deterministically, rather than depending
  // on whatever language the test runner happens to default to.
  test.use({ locale: "fr-FR" });

  test("404s an unknown locale rather than falling back", async ({
    page,
  }) => {
    // Silently rendering `/de/…` in French would hand Google a page whose
    // `lang` attribute lies about its content.
    const response = await page.goto("/de/anything");
    expect(response?.status()).toBe(404);
    // Asserts the rendered UI, not just the status — the previous version of
    // this test passed identically whether our styled 404 or Next's own
    // generic page rendered.
    await expect(page.getByText("Cette page n'existe pas")).toBeVisible();
    await expect(
      page.getByText("This page could not be found")
    ).not.toBeVisible();
  });
});

test("404s an unmatched URL under /en with English copy", async ({
  page,
}) => {
  // The deleted `global-not-found.tsx` reconstructed the locale from the
  // `NEXT_LOCALE` cookie, which next-intl only sets when the negotiated
  // locale differs from the default — so an English visitor whose cookie was
  // never set silently got French. The catch-all route reads the locale from
  // the URL segment instead, so this must render English.
  const response = await page.goto("/en/not-a-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("This page does not exist")).toBeVisible();
  await expect(
    page.getByText("This page could not be found")
  ).not.toBeVisible();
});

test("keeps the locale when following an internal link", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("link", { name: "Browse the catalog" }).click();
  // The locale-aware `Link` carries `/en` through; a bare `next/link` would
  // drop the reader onto the default locale.
  await expect(page).toHaveURL(/\/en\/design-system$/);
});
