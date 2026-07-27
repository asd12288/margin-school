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
          Placeholder
        </span>

        <div className="flex flex-col gap-3">
          <h1 className="text-display-lg font-bold text-foreground">
            Margin School
          </h1>
          <p className="text-prose text-muted-foreground">
            Learn the financial markets, from the beginning. The marketing site
            is Phase 8 — this page exists so the root route is not boilerplate.
          </p>
        </div>

        <EmptyState
          className="w-full"
          icon={Compass}
          title={t("states.empty.title")}
          description={t("states.empty.description")}
          action={
            <Button asChild>
              <Link href="/design-system">{t("states.empty.action")}</Link>
            </Button>
          }
        />
      </div>
    </main>
  );
}
