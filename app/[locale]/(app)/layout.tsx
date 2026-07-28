import { Suspense } from "react";
import { locale as rootLocale } from "next/root-params";
import { setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/margin/shell/app-header";
import { SkipLink } from "@/components/margin/shell/skip-link";
import { getShellLabels } from "@/lib/shell-labels";

/**
 * Navigation into this shell must be instant, and the build says so.
 *
 * `unstable_instant` re-renders every entry point into this subtree — a cold
 * load, and a client navigation from a sibling at each shared-layout boundary
 * above it — and fails the build if the frame cannot be served from the
 * static shell. That is the enforcement Tier 2 in docs/ux-architecture.md has
 * always needed: without it, a session read added to the header quietly turns
 * this frame into a spinner and nothing catches it.
 *
 * `samples` is required, not optional, because `locale` is a root param: the
 * validator's exhaustive-params proxy rejects any param it has not been told
 * about, with no fallback to the ancestor `generateStaticParams` that already
 * enumerates these two values. (The published `InstantConfig` type in
 * `instant.md` only allows `samples` alongside `prefetch: "runtime"`; the
 * runtime schema accepts it here and the validator needs it. Written as a
 * plain object literal, never `as const` — Next's segment-config extractor
 * has no case for `TsAsExpression` and fails the build on it.)
 *
 * This layout does **not** check auth. Layouts do not re-run on soft
 * navigation between sibling routes, so a layout-only gate is bypassable by
 * client navigation. Each page calls `requireProfile()` itself; see
 * lib/auth/dal.ts. Keeping the check out of here is also what lets the frame
 * stay static and render instantly.
 */
export const unstable_instant = {
  prefetch: "static",
  samples: [{ params: { locale: "fr" } }, { params: { locale: "en" } }],
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Not `await params` — see the note in app/[locale]/layout.tsx. Awaiting
  // params here would put the header itself behind the runtime stage, and
  // there would be no static frame left to render instantly.
  // Typed here because `next/root-params` ships untyped; the root layout has
  // already 404'd anything that is not `fr` or `en`.
  const locale: string = await rootLocale();
  setRequestLocale(locale);

  const labels = await getShellLabels();

  return (
    <>
      <SkipLink label={labels.skipToContent} />
      <AppHeader labels={labels} />
      <div id="main" className="flex flex-1 flex-col">
        {/*
         * Zero visual change — the boundary exists so each page's own gate
         * (`requireProfile()`, a cookie read) is a hole *below* this shell
         * rather than one that blocks it. The validator only allows a runtime
         * hole when a Suspense sits between it and the segment that declared
         * `unstable_instant`; without this, every page under here fails the
         * build.
         */}
        <Suspense fallback={null}>{children}</Suspense>
      </div>
    </>
  );
}
