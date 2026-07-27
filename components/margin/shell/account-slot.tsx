import { getCurrentProfile } from "@/lib/auth/dal";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui/skeleton";

import { AccountMenu, type AccountMenuLabels } from "./account-menu";

export interface AccountSlotLabels extends AccountMenuLabels {
  signIn: string;
  startTrial: string;
}

/**
 * The **only** part of the shell that reads the session.
 *
 * Everything else in the header is static and cached. If this call were made
 * in the layout instead, every page beneath it would become dynamic and Tier 1
 * in docs/ux-architecture.md would be lost silently — the same failure mode
 * that cost Tier 1 before the `[locale]` segment existed. Wrap this component
 * in `<Suspense>`; `unstable_instant` fails the build if anyone forgets.
 */
async function AccountSlot({ labels }: { labels: AccountSlotLabels }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sign-in">{labels.signIn}</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/sign-up">{labels.startTrial}</Link>
        </Button>
      </div>
    );
  }

  return (
    <AccountMenu
      labels={labels}
      isStaff={profile.role === "editor" || profile.role === "admin"}
    />
  );
}

/**
 * Suspense fallback. Fixed size, matching the widest real state, so the header
 * never shifts when the session resolves — skeleton rule 1.
 */
function AccountSlotSkeleton() {
  return <Skeleton className="h-8 w-32 rounded-4xl" />;
}

export { AccountSlot, AccountSlotSkeleton };
