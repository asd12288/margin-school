"use client";

import * as React from "react";
import { Check, Clock, Play } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FreePreviewBadge } from "@/components/margin/meta";
import { ProgressBar } from "@/components/margin/progress";
import { LockedHint, UnavailableInLocaleHint } from "@/components/margin/states";
import { cn } from "@/lib/utils";
import type { Chapter, Lesson, Locale } from "@/lib/fixtures/content";

/**
 * The curriculum accordion — the "what you'll learn" surface, and the one
 * screen where a beginner decides whether the course is worth their evening.
 *
 * The ordering principle from the brief is that it must always be obvious
 * where you are, what is next, and how much is left. So every chapter carries
 * its own progress, and every lesson states plainly whether it is finished,
 * free, locked, or simply not written in this language yet.
 */

/**
 * Every label is a plain string, and the per-entity ones are records keyed by
 * id rather than formatter functions.
 *
 * That is a hard constraint, not a preference: this is a client component, and
 * functions cannot cross the server/client boundary as props. Formatting —
 * plurals, durations, locale-aware numbers — happens on the server where
 * next-intl lives, and what arrives here is already words.
 */
export interface CurriculumLabels {
  /** Accessible name for each chapter's progress bar, keyed by chapter id. */
  chapterProgress: Record<string, string>;
  /** e.g. "3 / 8", keyed by chapter id. */
  chapterCount: Record<string, string>;
  /** Formatted lesson duration, e.g. "16 min", keyed by lesson id. */
  lessonDuration: Record<string, string>;
  /** e.g. "Completed" — visually hidden, read by screen readers. */
  completed: string;
  freePreview: string;
  locked: string;
  unavailableInLocale: string;
}

function LessonRow({
  lesson,
  labels,
  locale,
  current,
}: {
  lesson: Lesson;
  labels: CurriculumLabels;
  locale: Locale;
  current: boolean;
}) {
  const locked = lesson.accessState !== null;
  const unavailable = !lesson.availableLocales.includes(locale);

  return (
    <li
      data-slot="lesson-row"
      data-current={current}
      className={cn(
        "flex items-center gap-3 rounded-lg px-2.5 py-2",
        "transition-colors duration-fast ease-quiet",
        "hover:bg-muted",
        current && "bg-primary-muted"
      )}
    >
      {/* One glyph, three meanings: done, here, or ahead. */}
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-4xl border",
          "transition-colors duration-base ease-quiet",
          lesson.completed
            ? "border-transparent bg-progress-complete text-success-foreground"
            : current
              ? "border-transparent bg-progress-indicator text-primary-foreground"
              : "border-border-strong text-transparent"
        )}
      >
        {lesson.completed ? (
          <Check className="size-3" strokeWidth={3} />
        ) : current ? (
          <Play className="size-2.5 fill-current" />
        ) : null}
      </span>

      <span
        className={cn(
          "min-w-0 grow text-sm",
          locked || unavailable ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {lesson.title}
        {lesson.completed ? (
          <span className="sr-only"> — {labels.completed}</span>
        ) : null}
      </span>

      <span className="flex shrink-0 items-center gap-2">
        {lesson.isFreePreview ? (
          <FreePreviewBadge>{labels.freePreview}</FreePreviewBadge>
        ) : null}
        {unavailable ? (
          <UnavailableInLocaleHint label={labels.unavailableInLocale} />
        ) : locked ? (
          <LockedHint label={labels.locked} />
        ) : null}
        <span
          data-numeric
          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
        >
          <Clock className="size-3" />
          {labels.lessonDuration[lesson.id]}
        </span>
      </span>
    </li>
  );
}

function Curriculum({
  chapters,
  labels,
  locale,
  currentLessonId,
  defaultOpenChapterIds,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  chapters: Chapter[];
  labels: CurriculumLabels;
  locale: Locale;
  currentLessonId?: string;
  defaultOpenChapterIds?: string[];
}) {
  return (
    <div data-slot="curriculum" className={cn("w-full", className)} {...props}>
      <Accordion
        type="multiple"
        defaultValue={defaultOpenChapterIds ?? [chapters[0]?.id].filter(Boolean)}
      >
        {chapters.map((chapter) => {
          const completed = chapter.lessons.filter((l) => l.completed).length;

          return (
            <AccordionItem key={chapter.id} value={chapter.id}>
              <AccordionTrigger className="no-underline hover:no-underline">
                <span className="flex min-w-0 grow flex-col gap-1.5 pr-3">
                  <span className="flex items-baseline gap-2.5">
                    <span
                      data-numeric
                      className="font-mono text-xs text-muted-foreground"
                    >
                      {String(chapter.position).padStart(2, "0")}
                    </span>
                    <span className="font-heading text-base">
                      {chapter.title}
                    </span>
                    <span
                      data-numeric
                      className="ml-auto shrink-0 text-xs text-muted-foreground"
                    >
                      {labels.chapterCount[chapter.id]}
                    </span>
                  </span>
                  <ProgressBar
                    completed={completed}
                    total={chapter.lessons.length}
                    label={labels.chapterProgress[chapter.id]}
                  />
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="flex flex-col gap-0.5 pb-2">
                  {chapter.lessons.map((lesson) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      labels={labels}
                      locale={locale}
                      current={lesson.id === currentLessonId}
                    />
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

export { Curriculum };
