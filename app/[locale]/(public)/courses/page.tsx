import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CourseCard, CourseGrid } from "@/components/margin/course-card";
import { CourseGridSkeleton } from "@/components/margin/skeletons";
import { EmptyState } from "@/components/margin/states";
import { getCourseCardLabels, getCourseHref } from "@/lib/course-labels";
import { sampleCourses, sampleProgress } from "@/lib/fixtures/content";
import type { Course } from "@/lib/fixtures/content";
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
 *
 * **The `q` search param and the Cache Components split.** This route is
 * Tier 1 — prerendered, no loading state on a plain visit — and reading
 * `searchParams` anywhere outside a `<Suspense>` boundary fails the build
 * under this project's `cacheComponents: true` (`next.config.ts`): it is
 * request data, exactly like `cookies()`. The heading and the page frame stay
 * static and read only `params` (the locale), following the precedent this
 * project already has in `app/[locale]/(public)/course/[course]/page.tsx`.
 * `CourseResults` is the one part that awaits `searchParams`, and it only
 * renders inside the `<Suspense>` below — never `"use cache"`, since the
 * filtered list is genuinely a function of the request's query string, not a
 * cacheable constant.
 *
 * The header's `SearchField` (`components/margin/shell/site-header.tsx`) does
 * not receive this page's current `q` as a `defaultValue`: it is rendered
 * from the public layout, and a layout never receives `searchParams` in the
 * App Router — only the page below it does. Threading the query up into the
 * header would require the header itself to read request data, which would
 * make every public page dynamic and lose Tier 1 site-wide. An empty search
 * box after a submitted search is the accepted trade — see the comment on
 * `SiteHeader`.
 */
function normalizeQuery(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function matchesQuery(course: Course, query: string): boolean {
  const haystack = `${course.title} ${course.summary}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

async function CourseResults({
  locale,
  searchParams,
}: {
  locale: string;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const query = normalizeQuery(q);

  const t = await getTranslations();
  const courses = query
    ? sampleCourses.filter((course) => matchesQuery(course, query))
    : sampleCourses;

  if (query && courses.length === 0) {
    return (
      <EmptyState
        className="mt-8"
        title={t("courses.searchEmpty.title", { query })}
        description={t("courses.searchEmpty.description")}
      />
    );
  }

  // `labels` is async now, so the whole list is resolved before rendering
  // rather than per-card inside the map. `getCourseCardLabels` is the one
  // place the `accessState` → label mapping lives, shared with the home
  // page's rail and the course page's "where to go next" rail — three copies
  // of it was three chances for "needs a prerequisite" to be mislabelled as
  // "needs a subscription".
  const cards = await Promise.all(
    courses.map(async (course) => {
      const progress = sampleProgress.find((p) => p.courseId === course.id);

      return {
        course,
        progress,
        href: getCourseHref(course, locale as Locale),
        labels: await getCourseCardLabels({
          course,
          locale: locale as Locale,
          progress,
        }),
      };
    })
  );

  return (
    <CourseGrid className="mt-8">
      {cards.map(({ course, progress, href, labels }) => (
        <CourseCard
          key={course.id}
          course={course}
          progress={progress}
          href={href}
          labels={labels}
        />
      ))}
    </CourseGrid>
  );
}

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="text-display font-bold tracking-tight text-foreground">
        {t("shell.nav.courses")}
      </h1>

      <Suspense fallback={<CourseGridSkeleton className="mt-8" />}>
        <CourseResults locale={locale} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
