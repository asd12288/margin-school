import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Curriculum } from "@/components/margin/curriculum";
import { CurriculumSkeleton } from "@/components/margin/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { sampleChapters, sampleCourses } from "@/lib/fixtures/content";
import type { Locale } from "@/lib/fixtures/content";

/**
 * Course detail, from fixtures. Phase 8 replaces the data source and adds
 * metadata, hreflang and structured data.
 *
 * `generateStaticParams` is what keeps this Tier 1 for every slug it lists —
 * prerendered, no loading state. It only lists the fixture slugs, though, and
 * under this project's `cacheComponents: true` (see `next.config.ts`), a
 * slug outside that list is genuinely runtime data: `params` cannot be
 * resolved for it until request time, and reading it — including to decide
 * whether to call `notFound()` — has to happen inside a `<Suspense>`
 * boundary, the same as any other runtime-only value under Cache Components
 * (see the "With Cache Components" section of the framework's own
 * `dynamic-routes` and `generate-static-params` docs). Without the boundary,
 * that read throws `DYNAMIC_SERVER_USAGE` for exactly the slugs that need
 * `notFound()`, past `next build`'s validation and into a request-time 500 —
 * confirmed against this exact Next.js version by requesting an unlisted
 * slug after `next build && next start`.
 *
 * The trade-off, spelled out in the framework's own streaming guide: once a
 * Suspense fallback has shipped, the `200` is already committed, so a
 * `notFound()` that resolves after it can only inject `<meta
 * name="robots" content="noindex">` rather than a real `404` status. For the
 * six known slugs this never shows — they resolve at build time and ship
 * whole, no fallback ever paints. It is only a genuinely-unknown slug that
 * takes the streamed path, and metadata (hence indexing) is Phase 8's job
 * regardless.
 *
 * `Curriculum` is a client component, so its per-entity labels are records
 * keyed by id rather than formatter functions: functions cannot cross the
 * server/client boundary. Plurals and durations are formatted here, on the
 * server, and what crosses is already words. See design-system.md:183.
 */
export function generateStaticParams() {
  return sampleCourses.map((course) => ({ course: course.slug }));
}

async function CourseContent({
  params,
}: {
  params: Promise<{ locale: string; course: string }>;
}) {
  const { locale, course: slug } = await params;
  setRequestLocale(locale);

  const course = sampleCourses.find((c) => c.slug === slug);
  if (!course) notFound();

  const t = await getTranslations();

  // The fixtures carry one course's curriculum, with no courseId on Chapter —
  // every course shows the same chapters until Phase 8 supplies real queries.
  const chapters = sampleChapters;

  const chapterProgress: Record<string, string> = {};
  const chapterCount: Record<string, string> = {};
  const lessonDuration: Record<string, string> = {};

  for (const chapter of chapters) {
    const completed = chapter.lessons.filter((lesson) => lesson.completed).length;
    const total = chapter.lessons.length;

    chapterProgress[chapter.id] = t("curriculum.chapterProgress", { completed, total });
    chapterCount[chapter.id] = t("curriculum.chapterCount", { completed, total });

    for (const lesson of chapter.lessons) {
      lessonDuration[lesson.id] = t("curriculum.lessonDuration", {
        minutes: lesson.estimatedMinutes,
      });
    }
  }

  return (
    <>
      <h1 className="text-display font-bold tracking-tight text-foreground">
        {course.title}
      </h1>
      <p className="measure-prose mt-3 text-prose text-muted-foreground">
        {course.summary}
      </p>

      <Curriculum
        className="mt-10"
        chapters={chapters}
        locale={locale as Locale}
        labels={{
          chapterProgress,
          chapterCount,
          lessonDuration,
          completed: t("curriculum.completed"),
          freePreview: t("curriculum.free"),
          locked: t("curriculum.locked"),
          unavailableInLocale: t("curriculum.notInThisLanguage"),
        }}
      />
    </>
  );
}

function CoursePageFallback() {
  return (
    <>
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="mt-3 h-5 w-full max-w-xl" />
      <CurriculumSkeleton className="mt-10" />
    </>
  );
}

export default function CoursePage({
  params,
}: {
  params: Promise<{ locale: string; course: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
      <Suspense fallback={<CoursePageFallback />}>
        <CourseContent params={params} />
      </Suspense>
    </main>
  );
}
