import { locale as rootLocale } from "next/root-params";
import { setRequestLocale } from "next-intl/server";

import { SiteFooter } from "@/components/margin/shell/site-footer";
import { SiteHeader } from "@/components/margin/shell/site-header";
import { SkipLink } from "@/components/margin/shell/skip-link";
import { getShellLabels } from "@/lib/shell-labels";

/**
 * Public shell — marketing, catalog, course pages.
 *
 * Static except for the account slot's Suspense boundary inside the header.
 * Nothing here may read cookies, headers or the session, or every page beneath
 * it becomes dynamic and Tier 1 is lost. `cacheComponents` is what makes that
 * a build failure rather than a thing to remember.
 *
 * **This layout carries no `unstable_instant`, unlike `(app)/layout.tsx`, and
 * it cannot.** A config here would apply to every route in the group, and one
 * of them is `[...rest]` — the catch-all whose entire job is to `notFound()`
 * so an unmatched URL gets a real 404 status instead of a soft one. It can
 * never render, so it can never be validated ("Could not validate
 * `unstable_instant` because an error prevented the target segment from
 * rendering"), and a child cannot opt out of an ancestor's config:
 * `isPageAllowedToBlock` in
 * `next/dist/server/app-render/instant-validation/instant-config.js` walks
 * top-down and returns `false` as soon as it meets a non-`false` config above,
 * so `export const unstable_instant = false` on the catch-all is ignored.
 *
 * The config therefore sits on the individual pages that can satisfy it —
 * `courses`, `course/[course]`, `legal/[doc]`. A page-level config still
 * re-renders this layout during validation, so the shell is covered by each of
 * them; what is lost is coverage of the routes that have none.
 *
 * The locale below comes from `next/root-params` rather than `await params`
 * for that reason, and only that reason — see `app/[locale]/layout.tsx` for
 * the mechanism. It is the one thing here that keeps those pages validatable,
 * so do not "simplify" it without rebuilding.
 *
 * `children` is deliberately *not* wrapped in a `<Suspense>`, unlike
 * `(app)/layout.tsx`. That boundary is needed there because each app page
 * awaits `params` in its own body; the validated pages here either read the
 * locale through `next/root-params` too or read `params` inside a boundary of
 * their own, so a wrapper here covers nothing. Checked by removing it: the
 * build still passes 79/79.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Not `await params`: under instant validation every server `params` access
  // defers to the Runtime stage, so awaiting it here would leave this shell
  // with no static frame at all — which is the whole thing Tier 1 is.
  const locale: string = await rootLocale();
  setRequestLocale(locale);

  const labels = await getShellLabels();

  return (
    <>
      <SkipLink label={labels.skipToContent} />
      <SiteHeader labels={labels} />
      <div id="main" className="flex flex-1 flex-col">{children}</div>
      <SiteFooter labels={labels.footer} />
    </>
  );
}
