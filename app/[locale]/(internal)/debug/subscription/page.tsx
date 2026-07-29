import { Suspense } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/dal";
import { setSubscriptionStatusAction } from "@/lib/entitlement/actions";
import type { AccessDecision } from "@/lib/entitlement/can-access";
import {
  describeToggleState,
  isSubscriptionToggleEnabled,
} from "@/lib/entitlement/dev-toggle";

export const metadata = { robots: { index: false, follow: false } };

/**
 * The dev-only subscription toggle (ADR-0006, PRO-184).
 *
 * Local development only — never preview, because preview shares the
 * production database (ADR-0010). The gate is `isSubscriptionToggleEnabled()`
 * and it is enforced twice: here, so the page does not exist, and again inside
 * the server action, so the write does not either.
 *
 * **Untranslated, on purpose.** AGENTS.md rule 7 makes every user-facing
 * string translatable, and this has no user: it is a developer tool that
 * cannot be reached outside local development. `/debug/observability` sets the
 * precedent. Anything a *reader* can see stays translated.
 *
 * The gate reads cookies and the profile, so it lives in an inner component
 * behind `<Suspense>` — under Cache Components an uncached read in the page
 * body fails the build. See docs/ux-architecture.md.
 */
export default async function SubscriptionTogglePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Cheap and synchronous — no request data — so the whole route can 404
  // before anything renders when the toggle is not available.
  if (!isSubscriptionToggleEnabled()) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Subscription toggle</h1>
        <p className="text-sm text-muted-foreground">
          Sets your own <code>profile.subscription_status</code> with no payment
          provider present, so both sides of the entitlement boundary can be
          demoed. Local development only.
        </p>
      </header>

      <Suspense fallback={null}>
        <TogglePanel />
      </Suspense>
    </main>
  );
}

async function TogglePanel() {
  // The decisions below come from `canAccess` itself, via the boundary. This
  // is the demonstration the issue asks for — "a free lesson and a paid lesson
  // behave differently, with no payment provider present" — rather than a
  // claim that they do.
  const state = describeToggleState(await requireProfile());

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Status</h2>
        <div className="flex flex-wrap gap-2">
          {state.statuses.map((status) => {
            const active = status === state.current;

            return (
              <form key={status} action={setSubscriptionStatusAction}>
                <input type="hidden" name="status" value={status} />
                <Button
                  type="submit"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  aria-pressed={active}
                >
                  {status}
                </Button>
              </form>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          What the boundary decides
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          <Decision label="Free preview lesson" decision={state.freePreview} />
          <Decision label="Everything else" decision={state.paid} />
        </ul>
      </section>
    </div>
  );
}

function Decision({
  label,
  decision,
}: {
  label: string;
  decision: AccessDecision;
}) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2">
      <span>{label}</span>
      <Badge variant={decision.allowed ? "secondary" : "outline"}>
        {decision.allowed ? "open" : decision.reason}
      </Badge>
    </li>
  );
}
