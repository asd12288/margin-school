import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Library } from "lucide-react";

import { requireOnboardedProfile } from "@/lib/auth/dal";
import { EmptyState } from "@/components/margin/states";

/**
 * Frame. Enrolment and progress are Phase 9. Gate in the page — see /learn.
 *
 * The gate is split into `MyCoursesFrame` and wrapped in `<Suspense>` because
 * `requireOnboardedProfile` reads cookies, and under Cache Components an
 * uncached read outside `<Suspense>` blocks the whole route and fails the
 * build.
 */
export default async function MyCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Suspense fallback={null}>
        <MyCoursesFrame />
      </Suspense>
    </main>
  );
}

async function MyCoursesFrame() {
  await requireOnboardedProfile();

  const t = await getTranslations("frames.myCourses");

  return (
    <EmptyState
      className="measure-narrow"
      icon={Library}
      title={t("title")}
      description={t("description")}
    />
  );
}
