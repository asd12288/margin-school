import { Suspense } from "react";
import { getLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ShellLabels } from "@/lib/shell-labels";

import { AccountSlot, AccountSlotSkeleton } from "./account-slot";
import { Logo, LogoMark } from "./logo";
import { NavLink } from "./nav-link";
import { SearchField } from "./search-field";
import { ThemeSwitch } from "./theme-switch";

/**
 * Public chrome: marketing, catalog, course pages.
 *
 * Static except for one Suspense boundary. That is the whole design — the
 * frame renders instantly from cache and only the account state streams, which
 * is what makes navigation never blink (docs/ux-architecture.md, Tier 2).
 *
 * ## What "Udemy-style" means here, and what it cannot mean
 *
 * The shape is borrowed: wordmark, a short nav, and a **wide search bar as the
 * centre of gravity** rather than a 12rem box tucked beside the nav. Search is
 * the affordance a visitor arriving from a query already knows how to use, and
 * giving it the middle column is the single change that most makes a catalog
 * read as a catalog.
 *
 * Three things a real Udemy header carries are absent, and none of them is an
 * oversight:
 *
 * - **No cart, no price, no badge count.** ADR-0001: one all-access
 *   subscription, nothing sold per course. A cart icon would be UI for a
 *   transaction that does not exist.
 * - **No "Teach on Margin School".** ADR-0002: we are the sole publisher and
 *   there are no external instructors to recruit.
 * - **No categories mega-menu.** `/courses/[...category]` is reserved in
 *   i18n/routing.ts but unbuilt, and a menu whose items 404 is worse than no
 *   menu. `/concepts` carries the browse-by-topic job until Phase 8.
 *
 * ## Layout
 *
 * Two rows, and the second one only exists below `md`. Above it the search
 * bar sits inline and takes the free space; below it there is genuinely not
 * enough width for a wordmark, a usable input and three controls on one line,
 * so the input drops to a full-width row of its own. Both rows render the same
 * component, but Tailwind's `hidden` is `display: none`, which removes the
 * inactive one from the accessibility tree — so a screen reader finds exactly
 * one `role="search"` landmark at any viewport, not two.
 *
 * `getLocale()` is the same ambient read `lib/shell-labels.ts` already relies
 * on — it resolves from the route segment `setRequestLocale` already set in
 * `(public)/layout.tsx`, not from a request header, so calling it here does
 * not cost Tier 1. It only exists to hand `SearchField` a typed `Locale` for
 * its `getPathname` call.
 *
 * `SearchField` does not receive a `defaultValue`: a layout never receives
 * `searchParams` in the App Router (only the page below it does), so there is
 * no way to thread the catalog's current `q` up into this header without
 * either making the header itself read request data — losing Tier 1 for every
 * public page — or turning this server component into a client one that
 * re-reads the URL, which contradicts `search-field.tsx`'s own design (a
 * plain GET form, no client JS required). An empty box after a submitted
 * search is the accepted trade.
 */
async function SiteHeader({ labels }: { labels: ShellLabels }) {
  const locale = (await getLocale()) as Locale;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        {/*
         * The mark below `sm`, the full wordmark above it. The wordmark is
         * ~172px of a 375px viewport's 343px content box, which is what made
         * the trial button overflow the row and the document scroll sideways
         * — the failure docs/design-system.md's responsive audit exists to
         * prevent. Both images are decorative and the link carries the name,
         * so the accessible name does not change with viewport width.
         */}
        <Link
          href="/"
          aria-label={labels.brand}
          className="shrink-0 rounded-4xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <LogoMark className="h-7 sm:hidden" />
          <span className="hidden sm:block">
            <Logo alt="" className="h-7" />
          </span>
        </Link>

        {/*
         * "Courses" survives at every width; the other two drop below `lg`
         * to make room for the search bar.
         *
         * Hiding the whole nav on a phone was the first attempt and it was
         * wrong: the catalog is this header's one essential destination, and
         * with the nav gone there was no link to it anywhere on screen — the
         * search box submits to `/courses`, but "type nothing and press
         * enter" is not a navigation affordance anybody finds. One short word
         * fits in the room a phone actually has; `Concepts` and `Pricing` are
         * a tap away in the footer.
         */}
        <nav
          className="flex shrink-0 items-center gap-1"
          aria-label={labels.navLabel}
        >
          <NavLink href="/courses" segment="courses" label={labels.nav.courses} />
          <NavLink
            href="/concepts"
            segment="concepts"
            label={labels.nav.concepts}
            className="hidden lg:inline-block"
          />
          <NavLink
            href="/pricing"
            segment="pricing"
            label={labels.nav.pricing}
            className="hidden lg:inline-block"
          />
        </nav>

        <SearchField
          locale={locale}
          labels={labels.search}
          className="hidden min-w-0 flex-1 md:block md:max-w-xl"
        />

        {/* No locale switcher here — it lives in the footer alone. Language is
            a once-per-visit decision, and the header's width is better spent
            on search and the one action. */}
        <div className="ms-auto flex shrink-0 items-center gap-2">
          <ThemeSwitch labels={labels.theme} />
          <Suspense fallback={<AccountSlotSkeleton />}>
            <AccountSlot labels={labels.account} />
          </Suspense>
        </div>
      </div>

      <div className="border-t border-border px-4 py-2 md:hidden">
        <SearchField locale={locale} labels={labels.search} />
      </div>
    </header>
  );
}

export { SiteHeader };
