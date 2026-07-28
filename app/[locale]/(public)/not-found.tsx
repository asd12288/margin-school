import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/margin/states";
import { Link } from "@/i18n/navigation";

/**
 * The 404 for the public shell — header, search, footer and all.
 *
 * Without this file, `notFound()` thrown anywhere under `(public)` (an unknown
 * course slug, an unknown legal document) bubbled past the route group to
 * `app/[locale]/not-found.tsx`, which sits *outside* it. That page renders
 * correctly but with no chrome at all: no header, no nav, no search box, no
 * footer — a dead end on the one screen where a visitor most needs a way out.
 * Next resolves `notFound()` to the nearest `not-found` boundary in the
 * segment hierarchy, so putting one inside the group is what keeps the shell
 * wrapped around it.
 *
 * `app/[locale]/not-found.tsx` stays exactly as it is. It is still the
 * boundary for everything outside this group — the app and admin shells, and
 * `requireRole()`'s probe response — and this file deliberately does not
 * change that behaviour, only the public half of it.
 *
 * The body is the same three elements as the outer one, and the duplication is
 * on purpose: `not-found.js` takes no props, so a shared component would have
 * to re-derive the locale anyway, and the two files are free to diverge as the
 * public 404 grows suggestions the app-shell 404 should not have.
 *
 * Like the outer page it relies on `setRequestLocale()` having already run in
 * `app/[locale]/layout.tsx` for this request — `getTranslations()` with no
 * explicit locale is what lets one component render in either language no
 * matter how deep the `notFound()` that reached it was thrown.
 */
export default async function PublicNotFound() {
  const t = await getTranslations("errors.notFound");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <EmptyState
        className="measure-narrow"
        icon={Compass}
        title={t("title")}
        description={t("description")}
        action={
          <Button asChild>
            <Link href="/courses">{t("action")}</Link>
          </Button>
        }
      />
    </main>
  );
}
