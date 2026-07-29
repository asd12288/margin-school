import * as React from "react";
import { BookOpen, Clock, Layers, Lock, Play } from "lucide-react";

import { CourseCover } from "@/components/margin/course-cover";
import { FreePreviewBadge, MetaRow, MetaStat } from "@/components/margin/meta";
import { UnavailableInLocaleHint } from "@/components/margin/states";
import { cn } from "@/lib/utils";
import { isComplete, toPercent } from "@/lib/progress";
import type { Course, CourseProgress } from "@/lib/fixtures/content";

/**
 * The course card.
 *
 * The structure is Udemy's, because it is well-tested and people already
 * recognise it: a 16:9 cover with a badge overlaid, a bold title clamped to
 * two lines, a short description, then a row of facts. Progress, when there
 * is any, runs along the bottom edge of the cover — the same place Udemy puts
 * it in "My learning", and the one spot on a card that is always visible in a
 * dense grid.
 *
 * What is deliberately absent is the rest of that card. Udemy's version
 * carries a price, a struck-through price, a rating, a rating count, a
 * "Bestseller" flag and an instructor name. All six exist to convert a
 * one-off purchase and are incoherent here: access is one all-access
 * subscription (ADR-0001), and we are the sole publisher and do not invent
 * social proof (ADR-0002). Our equivalent lever is demonstrated depth, so the
 * facts that survive are the ones about the course itself — how long it is,
 * how much of it there is, and how far you have got.
 *
 * Every label is a prop. The component knows the shape of a course; it does
 * not know English.
 */

export interface CourseCardLabels {
  /** e.g. "18 lessons" — already pluralised and translated by the caller. */
  lessons: string;
  /** e.g. "4 chapters" */
  chapters: string;
  /** e.g. "4 h" */
  duration: string;
  /** e.g. "Free preview" */
  freePreview?: string;
  /** e.g. "Included with a subscription" */
  locked?: string;
  /** e.g. "Not yet in English" */
  unavailableInLocale?: string;
  /** Accessible name for the progress bar, e.g. "11 of 18 lessons complete". */
  progress?: string;
  /** Visible progress text, e.g. "61% complete". */
  progressShort?: string;
  /** Alt text when the course has real cover art. */
  coverAlt?: string;
}

function CourseCard({
  course,
  progress,
  labels,
  href,
  className,
  ...props
}: Omit<React.ComponentProps<"article">, "children"> & {
  course: Course;
  progress?: CourseProgress;
  labels: CourseCardLabels;
  href: string;
}) {
  // The card does not decide access — `labels.locked` is the boundary's answer
  // already turned into words by `getCourseCardLabels`, and its presence is
  // the whole signal. ADR-0006: no inline subscription checks, ever.
  const locked = labels.locked !== undefined;
  const started = progress !== undefined && progress.lessonsCompleted > 0;
  const percent = progress
    ? toPercent(progress.lessonsCompleted, progress.lessonsTotal)
    : 0;
  const complete = progress
    ? isComplete(progress.lessonsCompleted, progress.lessonsTotal)
    : false;

  return (
    <article
      data-slot="course-card"
      data-locked={locked}
      className={cn(
        "group/card relative flex flex-col overflow-hidden rounded-xl border border-border",
        "bg-card shadow-card",
        "transition-[border-color,box-shadow,transform] duration-base ease-quiet",
        "hover:-translate-y-1 hover:border-border-strong hover:shadow-raised",
        "focus-within:border-ring focus-within:shadow-raised",
        className
      )}
      {...props}
    >
      <div className="relative aspect-video w-full">
        <CourseCover
          courseId={course.id}
          src={course.coverImageUrl}
          alt={labels.coverAlt}
          className="size-full"
        />

        {/* A scrim, so an overlaid badge stays legible whatever the cover
            turns out to be. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent" />

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {course.hasFreePreview && labels.freePreview ? (
            <FreePreviewBadge className="shadow-card">
              <Play className="size-2.5 fill-current" />
              {labels.freePreview}
            </FreePreviewBadge>
          ) : (
            <span />
          )}
          {labels.locked ? (
            <span
              title={labels.locked}
              className="flex size-6 items-center justify-center rounded-4xl bg-background/85 text-muted-foreground shadow-card backdrop-blur-sm"
            >
              <Lock className="size-3" />
              <span className="sr-only">{labels.locked}</span>
            </span>
          ) : null}
        </div>

        {/* Progress rides the bottom edge of the cover: always visible in a
            dense grid, and it never competes with the title. */}
        {started && labels.progress ? (
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={labels.progress}
            className="absolute inset-x-0 bottom-0 h-1 bg-black/20"
          >
            <div
              className={cn(
                "h-full transition-[width] duration-slow ease-quiet",
                complete ? "bg-progress-complete" : "bg-progress-indicator"
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
        ) : null}
      </div>

      <div className="flex grow flex-col p-4">
        <span className="text-xs font-semibold tracking-wide text-primary-text uppercase">
          {course.categoryName}
        </span>

        <h3 className="mt-1.5 line-clamp-2 text-base leading-snug font-semibold text-card-foreground">
          {/* The whole card is the click target; the link carries the name. */}
          <a
            href={href}
            className="outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {course.title}
          </a>
        </h3>

        <p className="mt-1.5 line-clamp-2 grow text-sm leading-relaxed text-muted-foreground">
          {course.summary}
        </p>

        <MetaRow className="mt-3.5">
          <MetaStat icon={Clock}>
            <span data-numeric>{labels.duration}</span>
          </MetaStat>
          <MetaStat icon={BookOpen}>
            <span data-numeric>{labels.lessons}</span>
          </MetaStat>
          <MetaStat icon={Layers}>
            <span data-numeric>{labels.chapters}</span>
          </MetaStat>
        </MetaRow>

        {(started && labels.progressShort) || labels.unavailableInLocale ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {started && labels.progressShort ? (
              <span
                data-numeric
                className={cn(
                  "text-xs font-medium",
                  complete ? "text-gain" : "text-primary-text"
                )}
              >
                {labels.progressShort}
              </span>
            ) : null}
            {labels.unavailableInLocale ? (
              <UnavailableInLocaleHint
                className="ml-auto"
                label={labels.unavailableInLocale}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

/**
 * The grid. Sized by a comfortable card width rather than a column count, so
 * French titles get the same room as English ones without a breakpoint per
 * locale.
 */
function CourseGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="course-grid"
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))] gap-5",
        className
      )}
      {...props}
    />
  );
}

export { CourseCard, CourseGrid };
