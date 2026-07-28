import Image from "next/image";

import logoDark from "@/public/brand/margin-school-logo-dark.png";
import logoLight from "@/public/brand/margin-school-logo.png";
import mark from "@/public/brand/margin-school-mark-tight.png";
import { cn } from "@/lib/utils";

/**
 * The wordmark, theme-aware.
 *
 * **Two files, not one recoloured file.** The mark's blue-to-violet gradient
 * is identical in both, but the "Margin School" lettering is near-black in one
 * and near-white in the other, and there is no CSS that turns one into the
 * other without also wrecking the gradient (`invert` sends blue to orange).
 * So both ship and `dark:` picks. The cost is that a browser downloads both:
 * at the sizes used here that is a few KB of AVIF each, which is cheaper than
 * the alternative below.
 *
 * **Not a `useTheme()` swap**, which is the obvious way to download only one.
 * `next-themes` resolves after hydration, so the first paint would either
 * guess wrong and flash the wrong logo on every cold load, or render nothing
 * and pop the header's first element in late. Swapping with the `dark:` class
 * is decided by CSS in the same paint as everything else. `ThemeSwitch`
 * accepts that flash risk for its trigger glyph and guards it with
 * `useSyncExternalStore`; a logo is too big and too central to do the same.
 *
 * **Not an inline SVG**, which would be lighter still and is what a logo in a
 * header usually wants. The lettering is a geometric sans that is *not* Inter
 * — redrawing it in the loaded UI face would quietly ship a different
 * wordmark, and public/brand/README.md is explicit that the logo is not to be
 * altered. Ask the designer for an SVG and this component becomes cheaper
 * with no other change.
 *
 * Sized by `className` height + `w-auto`; the static imports carry the
 * intrinsic 1634×236, so the aspect ratio holds and Next emits no layout
 * warning. Never set a width — French and English render the identical
 * bitmap, so there is nothing here that changes length by locale.
 *
 * `sizes` is not optional here, and its absence is invisible until measured.
 * Without it Next has no render width to reason about — the height comes from
 * a CSS class it cannot see — so it falls back to the largest entry in
 * `deviceSizes` and the browser fetches a **3840px** variant to paint a
 * 194px-wide wordmark, upscaled past the 1634px source. Declaring the real
 * footprint puts it back on a ~256px variant. Measured with
 * `img.currentSrc` on a running page, not inferred.
 */
const LOGO_SIZES = "(min-width: 640px) 200px, 172px";

function Logo({
  /** Accessible name. Empty when an adjacent element already names the link. */
  alt,
  className,
  /** Overrides `LOGO_SIZES` where the wordmark renders at another footprint. */
  sizes = LOGO_SIZES,
}: {
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const shared = cn("w-auto object-contain", className);

  return (
    <>
      <Image
        src={logoLight}
        alt={alt}
        sizes={sizes}
        className={cn(shared, "block dark:hidden")}
        // The wordmark is the first thing in the header on every page, and
        // the two variants are mutually exclusive — only one is ever painted,
        // so this does not preload twice as much as it looks like.
        priority
      />
      <Image
        src={logoDark}
        // Already announced by the copy above; a second identical alt makes a
        // screen reader say the brand name twice on every page.
        alt=""
        aria-hidden="true"
        sizes={sizes}
        className={cn(shared, "hidden dark:block")}
        priority
      />
    </>
  );
}

/**
 * The mark on its own, for widths where the wordmark does not fit.
 *
 * At 375px the full wordmark is ~172px of a 343px content box, which left the
 * header's own controls overflowing and the document scrolling sideways —
 * the exact failure docs/design-system.md's responsive audit exists to catch.
 * The mark is 38px at the same height.
 *
 * **Always decorative.** It carries no `alt`, so whatever wraps it must supply
 * the accessible name (the headers use `aria-label` on the link). That is
 * deliberate: this and `Logo` are swapped by `display`, and a name on each
 * would mean the link's accessible name silently depended on viewport width.
 *
 * One file, not a light/dark pair: the gradient reads on both themes, which is
 * the whole reason the mark exists as a separate asset.
 *
 * The source is `margin-school-mark-tight.png`, which is
 * `margin-school-mark.png` cropped to its alpha bounds. The shipped 1024²
 * mark letterboxes the glyph into the middle 75%×47% of the canvas, so at
 * `h-7` it would paint about 13px of actual logo inside 28px of nothing.
 * Cropping transparent padding is not one of the alterations
 * public/brand/README.md rules out — no recolour, no stretch, no rotation, and
 * the proportions are the source's own.
 */
function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src={mark}
      alt=""
      aria-hidden="true"
      sizes="48px"
      className={cn("w-auto object-contain", className)}
    />
  );
}

export { Logo, LogoMark };
