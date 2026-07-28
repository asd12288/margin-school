import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/margin/states";
import { Link } from "@/i18n/navigation";

/**
 * Reached by `notFound()` from a page, and by `requireRole` when a student
 * probes a staff route — which is why this reads as an ordinary missing page
 * and never mentions permissions. A 403 would confirm that /admin exists.
 *
 * `not-found.js` takes no props (see Next's own file-convention reference),
 * so the locale can't be read from `params` here the way every other page
 * reads it. `getTranslations()` with no explicit locale instead relies on
 * `setRequestLocale()` already having run higher up this same request's
 * `[locale]/layout.tsx` — the one mechanism that lets this exact component
 * render correctly in French or English regardless of how deep in the tree
 * the `notFound()` that reached it was thrown (a plain 404, or `requireRole`
 * probing a staff route).
 *
 * That ambient-locale lookup is what prints 4 `DYNAMIC_SERVER_USAGE` lines
 * during `npm run build` (pinned via `next build --debug-prerender`, which
 * names this exact line and blames Route `/[locale]/[...rest]`). They fire
 * only for `[...rest]`'s placeholder path — the one route whose
 * `generateStaticParams` (see its file) makes Next attempt a fully *static*
 * render (no `<Suspense>`) rather than the partial-prerender every gated
 * page already uses. During that attempt Next probes this component to see
 * if it's static-safe, next-intl's locale fallback touches `headers()`, the
 * probe logs the digest and reruns — twice per locale, four lines, build
 * still exits 0 and the route still ships static. Passing an explicit
 * locale would silence the probe but reintroduces exactly what sank
 * `global-not-found.tsx` (see the "Fix: catch-all replaces globalNotFound"
 * note in `.superpowers/sdd/task-9-report.md`): a locale source this
 * component can't reliably have without props. Expected; do not "fix" by
 * chasing these lines away.
 */
export default async function NotFound() {
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
