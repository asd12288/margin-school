import { getTranslations, setRequestLocale } from "next-intl/server";

import { CourseCard, CourseGrid } from "@/components/margin/course-card";
import { getPathname } from "@/i18n/navigation";
import { sampleCourses, sampleProgress } from "@/lib/fixtures/content";
import type { Locale } from "@/i18n/routing";

/**
 * Catalog, from fixtures.
 *
 * Filters, categories, SEO metadata and real queries are Phase 8. This exists
 * so the shell is judged with content in it rather than against grey boxes,
 * and so the fixtures get exercised by a real page before the content tables
 * are designed around them.
 *
 * `locked`'s reason and `unavailableInLocale` follow `CatalogShowcase` in
 * `app/[locale]/(internal)/design-system/product.tsx` — the one place in the
 * codebase that already demonstrates the full `CourseCardLabels` contract
 * against these same fixtures. A course's `accessState` distinguishes "needs
 * a subscription" from "needs a prerequisite first"; collapsing both to one
 * label would mislead the reader about what unlocks it.
 */
export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="text-display font-bold tracking-tight text-foreground">
        {t("shell.nav.courses")}
      </h1>

      <CourseGrid className="mt-8">
        {sampleCourses.map((course) => {
          const progress = sampleProgress.find((p) => p.courseId === course.id);

          return (
            <CourseCard
              key={course.id}
              course={course}
              progress={progress}
              href={getPathname({
                href: { pathname: "/course/[course]", params: { course: course.slug } },
                locale: locale as Locale,
              })}
              labels={{
                lessons: t("course.lessons", { count: course.lessonCount }),
                chapters: t("course.chapters", { count: course.chapterCount }),
                duration: t("course.duration", {
                  hours: Math.round(course.estimatedMinutes / 60),
                }),
                freePreview: course.hasFreePreview ? t("course.freePreview") : undefined,
                locked:
                  course.accessState === "requires-subscription"
                    ? t("course.included")
                    : course.accessState === "requires-prerequisite"
                      ? t("course.laterInPath")
                      : undefined,
                unavailableInLocale: course.availableLocales.includes(locale as Locale)
                  ? undefined
                  : t("course.notInThisLanguage"),
                progress: progress
                  ? t("course.progress", {
                      completed: progress.lessonsCompleted,
                      total: progress.lessonsTotal,
                    })
                  : undefined,
                progressShort: progress
                  ? t("course.progressShort", {
                      percent: Math.round(
                        (progress.lessonsCompleted / progress.lessonsTotal) * 100
                      ),
                    })
                  : undefined,
                coverAlt: t("course.coverAlt", { title: course.title }),
              }}
            />
          );
        })}
      </CourseGrid>
    </main>
  );
}
