import { getCurrentProfile, isStaff } from "@/lib/auth/dal";
import { AnalyticsIdentity } from "@/lib/analytics/identity";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui/skeleton";

import { AccountMenu, type AccountMenuLabels } from "./account-menu";

export interface AccountSlotLabels extends AccountMenuLabels {
  /**
   * The one signed-out action. There is deliberately no `signIn` alongside
   * it — the header renders a single button and the auth screens switch
   * between signing in and signing up themselves.
   */
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
    /**
     * One button, not the "Sign in" + "Start free trial" pair that stood
     * here. The auth screens carry their own switcher between signing in and
     * signing up (Phase 4), so the header does not have to choose for the
     * visitor — which means the header can spend its remaining width on the
     * action that matters rather than on two.
     *
     * It points at `/sign-up` and says so. A returning subscriber therefore
     * arrives at the sign-up side and switches once; that is the cost, and it
     * falls on the people who already know the product rather than on the
     * ones deciding whether to try it.
     */
    return (
      <Button size="sm" asChild>
        <Link href="/sign-up">{labels.startTrial}</Link>
      </Button>
    );
  }

  return (
    <>
      {/*
       * Identity rides along with the account menu because this component is
       * the shell's only session read, so it is the one place that already
       * knows who is signed in on every page. Giving it its own Suspense
       * boundary somewhere else would mean a second auth round trip per
       * render for a component that renders nothing.
       */}
      <AnalyticsIdentity userId={profile.id} />
      <AccountMenu labels={labels} isStaff={isStaff(profile)} />
    </>
  );
}

/**
 * Suspense fallback. Fixed size, matching the widest real state, so the header
 * never shifts when the session resolves — skeleton rule 1.
 *
 * Sized to the signed-out state — the single `size="sm"` trial button — which
 * is what an anonymous visitor sees while the session resolves, and is wider
 * than the signed-in `AccountMenu`'s `size-8` trigger.
 *
 * It used to reserve `w-56` (224px) for a two-button pair, measured at 187px
 * in English and 219px in French. Dropping the "Sign in" button removes that
 * button plus the `gap-2` between them, which puts both locales at roughly
 * 117px — the two labels ("Start free trial" / "Essai gratuit") happen to set
 * to nearly the same width. `w-32` (128px) is the smallest token above that
 * with room to spare. Re-measure with `getBoundingClientRect()` against a
 * production build if the copy changes; the old number is recorded here so
 * the next person can see what the reservation is actually made of.
 */
function AccountSlotSkeleton() {
  return <Skeleton className="h-8 w-32 rounded-4xl" />;
}

/**
 * Suspense fallback for `AppHeader` only (app and admin shells).
 *
 * Those shells sit behind `requireProfile()`/`requireRole()` — by the time
 * `AccountSlot` ever renders there, the visitor is always signed in, so the
 * signed-out two-button branch above can never be what resolves. Falling
 * back to the wide `AccountSlotSkeleton` (sized for that signed-out pair)
 * reserved 224px that the real content — `AccountMenu`'s `size-8` trigger —
 * never needed, and at a narrow viewport that reserved width, plus
 * `AppHeader`'s extra nav item versus the public header, overflowed the
 * non-wrapping header row horizontally. This mirrors the real element
 * exactly instead of over-reserving "just in case".
 */
function AccountMenuSkeleton() {
  return <Skeleton className="size-8 rounded-4xl" />;
}

export { AccountSlot, AccountSlotSkeleton, AccountMenuSkeleton };
