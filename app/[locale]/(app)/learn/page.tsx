import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Compass } from "lucide-react";

import { requireProfile } from "@/lib/auth/dal";
import { EmptyState } from "@/components/margin/states";

/**
 * The signed-in home. Not a dashboard: its job is one sentence and one
 * button — what to do now, and how long it takes. See ADR-0011. The real
 * next-action logic is Phase 9.
 *
 * The gate lives here rather than in the layout on purpose: layouts do not
 * re-run on soft navigation between siblings, so a layout-only check can be
 * walked past with a client navigation.
 *
 * The gate itself is split into `LearnFrame` and wrapped in `<Suspense>`:
 * `requireProfile` reads cookies, and under Cache Components an uncached
 * read outside `<Suspense>` blocks the whole route and fails the build. See
 * `(internal)/debug/observability/page.tsx` for the same pattern.
 */
export default async function LearnPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Suspense fallback={null}>
        <LearnFrame />
      </Suspense>
    </main>
  );
}

async function LearnFrame() {
  await requireProfile();

  const t = await getTranslations("frames.learn");

  return (
    <EmptyState
      className="measure-narrow"
      icon={Compass}
      title={t("title")}
      description={t("description")}
    />
  );
}
