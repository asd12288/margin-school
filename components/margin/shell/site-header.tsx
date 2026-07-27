import { Suspense } from "react";

import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/margin/theme-toggle";
import type { ShellLabels } from "@/lib/shell-labels";

import { AccountSlot, AccountSlotSkeleton } from "./account-slot";
import { LocaleSwitcher } from "./locale-switcher";
import { NavLink } from "./nav-link";

/**
 * Public chrome: marketing, catalog, course pages.
 *
 * Static except for one Suspense boundary. That is the whole design — the
 * frame renders instantly from cache and only the account state streams, which
 * is what makes navigation never blink (docs/ux-architecture.md, Tier 2).
 */
function SiteHeader({ labels }: { labels: ShellLabels }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
          {labels.brand}
        </Link>

        <nav className="flex items-center gap-1" aria-label={labels.navLabel}>
          <NavLink href="/courses" segment="courses" label={labels.nav.courses} />
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

export { SiteHeader };
