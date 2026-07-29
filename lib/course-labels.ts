import { getTranslations } from "next-intl/server";

import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { CourseCardLabels } from "@/components/margin/course-card";
import type { AccessDecision } from "@/lib/entitlement/can-access";
import type { Course, CourseProgress } from "@/lib/fixtures/content";

/**
 * Everything a `CourseCard` needs, derived from a course.
 *
 * Three surfaces render course cards — the catalog grid, the home page's
 * "start here" rail, and the course detail page's "where to go next" rail —
 * and each one was otherwise going to grow its own twenty-line `labels={{…}}`
 * literal. That duplication is not just verbose: a denial has two reasons with
 * two different labels, and collapsing them to one ("Included") tells a reader
 * that a course needing a prerequisite can be unlocked by paying. It is
 * exactly the kind of detail that gets right once and then drifts on copy
 * three.
 *
 * **The decision is passed in, never computed here.** This function turns a
 * verdict into words; deciding the verdict is `canAccess`'s job and nowhere
 * else's (ADR-0006). It is a parameter rather than a call because `canAccess`
 * reads user data and this function is called from cached surfaces — see the
 * note on `progress` below, which is the same constraint.
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
  access,
  progress,
}: {
  course: Course;
  locale: Locale;
  /**
   * What `canAccess` returned for this course and this viewer.
   *
   * Omitted on a cached surface, for the same reason as `progress`: it is
   * derived from user data, and `canAccess` must never be called inside a
   * `use cache` scope. The label then falls back to the *content* statement —
   * "included in the subscription" is a fact about the course, true for
   * everyone and safe to cache, where "you cannot open this" is not. See
   * `lockedLabel` below.
   */
  access?: AccessDecision;
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
    locked: lockedLabel(course, access, t),
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

type Translate = Awaited<ReturnType<typeof getTranslations>>;

/**
 * The lock label, from the viewer's decision when there is one and from the
 * course's own facts when there is not.
 *
 * **The two are different claims and the copy already reflects it.** "Included
 * in the subscription" describes the course; it is true for every reader and
 * is what a cached, prerendered public surface can honestly say. "You cannot
 * open this" describes a person, and only a runtime surface that has a viewer
 * may say it. Both land on the same string today because the string was
 * written as a statement about the course, which is what made this fallback
 * possible rather than a compromise.
 *
 * `requires-prerequisite` wins over the subscription in the content view.
 * Anonymously the subscription is what blocks *everyone*, so `canAccess`
 * reports it first and is right to; but a course that comes later in the path
 * is more usefully described that way on a marketing page than as one more
 * thing to buy.
 */
function lockedLabel(
  course: Course,
  access: AccessDecision | undefined,
  t: Translate
): string | undefined {
  if (access) {
    if (access.allowed) return undefined;
    return access.reason === "requires-prerequisite"
      ? t("course.laterInPath")
      : t("course.included");
  }

  if (course.prerequisiteCourseIds.length > 0) return t("course.laterInPath");
  return course.isFreePreview ? undefined : t("course.included");
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
