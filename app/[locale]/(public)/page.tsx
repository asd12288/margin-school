import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/margin/states";
import { Compass } from "lucide-react";

/**
 * Placeholder home page, and the first real proof that the i18n layer works
 * end to end.
 *
 * `EmptyState` is rendered here with translated copy rather than the English
 * literals the design-system page passes. Nothing about the component changed
 * to make that work — it never held a string in the first place, which is the
 * whole point of AGENTS.md rule 7 and the reason every component takes its
 * words as props.
 *
 * The badge, heading and lede used to be English literals in the JSX, so a
 * French visitor to `/fr` read the brand's own home page in English — on the
 * one page whose job is to demonstrate the translation layer. They are
 * `pages.home.*` now, the same namespace the other placeholder routes use.
 *
 * The copy no longer says "Phase 8" either. Roadmap phase numbers are how we
 * talk to each other, not something a visitor can act on; the other
 * placeholder pages say plainly that the page is being written, and this one
 * now matches them.
 *
 * The real marketing page is Phase 8.
 */
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Required per page, not just per layout. Without it this route falls back
  // to dynamic rendering even though the layout opted in.
  setRequestLocale(locale);

  const t = await getTranslations();

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="measure-narrow flex flex-col items-start gap-6">
        <span className="rounded-4xl bg-primary-muted px-2.5 py-1 text-xs font-medium text-primary-text">
          {t("pages.home.badge")}
        </span>

        <div className="flex flex-col gap-3">
          <h1 className="text-display-lg font-bold text-foreground">
            {t("pages.home.title")}
          </h1>
          <p className="text-prose text-muted-foreground">
            {t("pages.home.description")}
          </p>
        </div>

        <EmptyState
          className="w-full"
          icon={Compass}
          title={t("states.empty.title")}
          description={t("states.empty.description")}
          action={
            <Button asChild>
              {/*
               * `/courses`, not `/design-system`. This button has always been
               * labelled "Browse the catalog" / "Parcourir le catalogue" and
               * pointed at the internal design-system page instead — correct
               * when it was written, because the catalog did not exist and a
               * CTA to nothing is worse than a CTA to somewhere. The catalog
               * shipped with the fixture-backed pages; this link was never
               * updated to follow it, so the one button on the home page sent
               * visitors to an internal, `noindex` reference page.
               */}
              <Link href="/courses">{t("states.empty.action")}</Link>
            </Button>
          }
        />
      </div>
    </main>
  );
}
