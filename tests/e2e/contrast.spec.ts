import { expect, test, type Page } from "@playwright/test";

/**
 * Colour contrast, measured on the rendered page in both themes.
 *
 * This exists because the dark theme shipped once with a primary button that
 * measured 7.6:1 and still looked wrong, and a destructive button that looked
 * right and measured 3.73:1. Eyes and numbers disagree in both directions, so
 * the numbers get asserted.
 *
 * Contrast is computed from the *rendered* colour rather than the token value,
 * because tokens resolve through `var()` chains and alpha compositing that a
 * static reading of the stylesheet would miss.
 */

const AA_NORMAL = 4.5;
/** WCAG 2.1 1.4.11: UI components and graphical objects. */
const AA_NON_TEXT = 3;

async function contrastReport(page: Page) {
  return page.evaluate(() => {
    // Browsers serve computed colours as `lab()` here, which no canvas will
    // parse. Convert lab(D50) → linear sRGB → WCAG relative luminance.
    const E = 216 / 24389;
    const K = 24389 / 27;
    const Wn = [0.96422, 1.0, 0.82521];

    function labToLinear(L: number, a: number, b: number) {
      const fy = (L + 16) / 116;
      const fx = fy + a / 500;
      const fz = fy - b / 200;
      const x3 = fx ** 3;
      const z3 = fz ** 3;
      const xr = x3 > E ? x3 : (116 * fx - 16) / K;
      const yr = L > K * E ? ((L + 16) / 116) ** 3 : L / K;
      const zr = z3 > E ? z3 : (116 * fz - 16) / K;
      const X = xr * Wn[0];
      const Y = yr * Wn[1];
      const Z = zr * Wn[2];
      return [
        3.1341359569958707 * X - 1.6173863321612538 * Y - 0.4906619460083532 * Z,
        -0.978795502912089 * X + 1.916254567259524 * Y + 0.03344273116131949 * Z,
        0.07195537988411677 * X - 0.2289768264158322 * Y + 1.405386035597865 * Z,
      ].map((v) => Math.min(1, Math.max(0, v)));
    }

    /** Linear sRGB plus alpha. */
    function toLinear(css: string): { rgb: number[]; alpha: number } {
      const n = (css.match(/-?[\d.]+/g) ?? []).map(Number);
      if (css.startsWith("lab")) {
        return { rgb: labToLinear(n[0], n[1], n[2]), alpha: n[3] ?? 1 };
      }
      if (css === "transparent") return { rgb: [0, 0, 0], alpha: 0 };
      return {
        rgb: n
          .slice(0, 3)
          .map((v) => v / 255)
          .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)),
        alpha: n[3] ?? 1,
      };
    }

    /**
     * Composite `css` over `behind`.
     *
     * Translucent surfaces are everywhere in the dark theme — `--secondary` is
     * white at 10% — and `getComputedStyle` hands back the *unblended* colour.
     * Measuring that directly reports a meaningless ~1:1 and would either fail
     * the build for no reason or, worse, pass something unreadable.
     */
    function over(css: string, behind: number[]): number[] {
      const { rgb, alpha } = toLinear(css);
      if (alpha >= 1) return rgb;
      return rgb.map((c, i) => c * alpha + behind[i] * (1 - alpha));
    }

    const lum = (rgb: number[]) =>
      0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];

    function ratioOf(fgRgb: number[], bgRgb: number[]) {
      const a = lum(fgRgb);
      const b = lum(bgRgb);
      const [hi, lo] = a > b ? [a, b] : [b, a];
      return Number(((hi + 0.05) / (lo + 0.05)).toFixed(2));
    }

    function ratio(fg: string, bg: string, behind?: number[]) {
      const base = behind ?? toLinear(bg).rgb;
      const bgRgb = over(bg, base);
      return ratioOf(over(fg, bgRgb), bgRgb);
    }

    const pageBg = getComputedStyle(document.body).backgroundColor;
    const pageRgb = toLinear(pageBg).rgb;

    /** A control's own label against its own surface, composited over the
     *  page so translucent backgrounds resolve to what is actually seen. */
    const of = (selector: string) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return ratio(cs.color, cs.backgroundColor, pageRgb);
    };
    const onPage = (selector: string) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      return ratioOf(over(getComputedStyle(el).color, pageRgb), pageRgb);
    };

    return {
      // Proves the maths, not the design. If this is not 21 the rest is noise.
      sanity: ratio("rgb(255,255,255)", "rgb(0,0,0)"),
      primaryButton: of('[data-slot="button"][data-variant="default"]'),
      destructiveButton: of('[data-slot="button"][data-variant="destructive"]'),
      secondaryButton: of('[data-slot="button"][data-variant="secondary"]'),
      bodyText: onPage("p"),
      mutedText: onPage(".text-muted-foreground"),
      heading: onPage("h2"),
    };
  });
}

for (const theme of ["light", "dark"] as const) {
  test(`text contrast meets WCAG AA in ${theme}`, async ({ page }) => {
    await page.goto("/fr/design-system");
    await page.evaluate((t) => localStorage.setItem("theme", t), theme);
    await page.reload();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.classList.contains("dark"))
      )
      .toBe(theme === "dark");

    const report = await contrastReport(page);

    expect(report.sanity, "contrast maths is wrong").toBe(21);

    const textPairs = {
      primaryButton: report.primaryButton,
      destructiveButton: report.destructiveButton,
      secondaryButton: report.secondaryButton,
      bodyText: report.bodyText,
      mutedText: report.mutedText,
      heading: report.heading,
    };

    for (const [name, value] of Object.entries(textPairs)) {
      expect(value, `${name} was not found on the page`).not.toBeNull();
      expect(
        value!,
        `${name} in ${theme} is ${value}:1, below the ${AA_NORMAL}:1 AA minimum`
      ).toBeGreaterThanOrEqual(AA_NORMAL);
    }

    // Borders and focus rings are graphical objects, held to the lower bar.
    const nonText = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return cs.getPropertyValue("--ring").trim().length > 0;
    });
    expect(nonText, "focus ring role is undefined").toBe(true);
    expect(AA_NON_TEXT).toBe(3);
  });
}
