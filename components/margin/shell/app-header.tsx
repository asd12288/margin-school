import { Suspense } from "react";

import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/margin/theme-toggle";
import type { ShellLabels } from "@/lib/shell-labels";

import { AccountSlot, AccountSlotSkeleton } from "./account-slot";
import { LocaleSwitcher } from "./locale-switcher";
import { NavLink } from "./nav-link";

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
        <Link href="/learn" className="text-sm font-semibold tracking-tight text-foreground">
          {labels.brand}
        </Link>

        <nav className="flex items-center gap-1" aria-label={labels.navLabel}>
          <NavLink href="/learn" segment="learn" label={labels.nav.learn} />
          <NavLink href="/my-courses" segment="my-courses" label={labels.nav.myCourses} />
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <LocaleSwitcher labels={labels.locale} />
          <ThemeToggle labels={labels.theme} className="hidden sm:inline-flex" />
          <Suspense fallback={<AccountSlotSkeleton />}>
            <AccountSlot labels={labels.account} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export { AppHeader };
