import { Suspense } from "react";

import { Link } from "@/i18n/navigation";
import type { ShellLabels } from "@/lib/shell-labels";

import { AccountMenuSkeleton, AccountSlot } from "./account-slot";
import { LocaleSwitcher } from "./locale-switcher";
import { Logo, LogoMark } from "./logo";
import { NavLink } from "./nav-link";
import { ThemeSwitch } from "./theme-switch";

/**
 * App chrome — a top bar, not a sidebar.
 *
 * Four links do not earn `ui/sidebar.tsx`, and Phase 9 is when the player
 * actually needs a rail; building one now would mean designing it against a
 * player that does not exist. Same static-frame rule as the public header: the
 * account slot is the only dynamic part.
 */
function AppHeader({ labels }: { labels: ShellLabels }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        {/* The wordmark, same as the public header — but pointing at `/learn`,
            because for a signed-in reader "home" is the study area, not the
            marketing page (ADR-0011). No search bar here: the app shell's job
            is to get you back into a lesson, and browsing lives on the public
            side.

            `aria-label` on the link, both images decorative. Naming the light
            variant instead looks like it works and is only correct in light
            theme: the two are swapped with `dark:`, so in dark mode the only
            named image is `display: none` and the link is left with no
            accessible name at all — axe `link-name`, caught by the app-shell
            scan in tests/e2e/design-system.spec.ts.

            The mark below `sm` for the same reason as the public header: this
            row carries two nav items plus three controls, and the wordmark
            pushed it past a phone's width. */}
        <Link
          href="/learn"
          aria-label={labels.brand}
          className="shrink-0 rounded-4xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <LogoMark className="h-6 sm:hidden" />
          <span className="hidden sm:block">
            <Logo alt="" className="h-6" />
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label={labels.navLabel}>
          <NavLink href="/learn" segment="learn" label={labels.nav.learn} />
          <NavLink href="/my-courses" segment="my-courses" label={labels.nav.myCourses} />
        </nav>

        <div className="ms-auto flex items-center gap-2">
          {/* The locale switcher is gone from the *public* header, which has a
              footer to hold it. This shell has no footer, so removing it here
              too would leave a signed-in reader no way to change language at
              all. It stays until the app shell grows somewhere better to put
              it — the account menu is the natural home. */}
          <LocaleSwitcher labels={labels.locale} />
          <ThemeSwitch labels={labels.theme} />
          <Suspense fallback={<AccountMenuSkeleton />}>
            <AccountSlot labels={labels.account} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export { AppHeader };
