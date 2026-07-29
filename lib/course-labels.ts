import { getTranslations } from "next-intl/server";

import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { CourseCardLabels } from "@/components/margin/course-card";
import type { Course, CourseProgress } from "@/lib/fixtures/content";

/**
 * Everything a `CourseCard` needs, derived from a course.
 *
 * Three surfaces render course cards — the catalog grid, the home page's
 * "start here" rail, and the course detail page's "where to go next" rail —
 * and each one was otherwise going to grow its own twenty-line `labels={{…}}`
 * literal. That duplication is not just verbose: `accessState` has two values
 * with two different labels, and collapsing them to one ("Included") tells a
 * reader that a course needing a prerequisite can be unlocked by paying. It is
 * exactly the kind of detail that gets right once and then drifts on copy
 * three.
 *
 * The locale is passed explicitly rather than read from the ambient request.
 * Two callers need that: `getTranslations({ locale })` is the only form usable
 * inside a `use cache` scope (the request-scoped locale set by
 * `setRequestLocale` is invisible there), and next-intl's fallback for a
 * missing locale is `headers()` — the single thing that would make a cached
 * function uncacheable.
 */
export async function getCourseCardLabels({
  course,
  locale,
  progress,
}: {
  course: Course;
  locale: Locale;
  /** User-domain data. Omitted on any cached surface — content and user data
   *  must never be read inside the same cached function (AGENTS.md rule 3). */
  progress?: CourseProgress;
}): Promise<CourseCardLabels> {
  const t = await getTranslations({ locale });

  return {
    lessons: t("course.lessons", { count: course.lessonCount }),
    chapters: t("course.chapters", { count: course.chapterCount }),
    duration: t("course.duration", { hours: courseHours(course) }),
    freePreview: course.hasFreePreview ? t("course.freePreview") : undefined,
    locked:
      course.accessState === "requires-subscription"
        ? t("course.included")
        : course.accessState === "requires-prerequisite"
          ? t("course.laterInPath")
          : undefined,
    unavailableInLocale: course.availableLocales.includes(locale)
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
  };
}

/**
 * The localized URL for a course.
 *
 * `getPathname`, never a template string: French segments are translated, not
 * prefixed (`/fr/cours/…`, not `/fr/course/…`), and a hand-built path sends a
 * French reader to a 404 — a bug only visible to the readers we have most of.
 */
export function getCourseHref(course: Course, locale: Locale): string {
  return getPathname({
    href: { pathname: "/course/[course]", params: { course: course.slug } },
    locale,
  });
}

/** Estimated duration in whole hours. Rounded once, here, so the card, the
 *  detail page and the catalog stat band never disagree by one. */
export function courseHours(course: Course): number {
  return Math.round(course.estimatedMinutes / 60);
}
