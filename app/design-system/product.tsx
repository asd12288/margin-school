import * as React from "react";
import { BookOpen, Compass } from "lucide-react";

import { Section } from "./foundations";
import { ErrorStateDemo } from "./states-demo";
import { Button } from "@/components/ui/button";
import { CourseCard, CourseGrid } from "@/components/margin/course-card";
import { Curriculum, type CurriculumLabels } from "@/components/margin/curriculum";
import { LessonBlocks, type LessonBlockLabels } from "@/components/margin/lesson/blocks";
import { ConceptChip, MetaRow, MetaStat } from "@/components/margin/meta";
import { ProgressBar, ProgressRail, ProgressRing } from "@/components/margin/progress";
import {
  CourseGridSkeleton,
  CurriculumSkeleton,
  LessonSkeleton,
} from "@/components/margin/skeletons";
import {
  EmptyState,
  LockedState,
  UnavailableInLocaleState,
} from "@/components/margin/states";
import {
  sampleBlocks,
  sampleChapters,
  sampleConcepts,
  sampleCourses,
  sampleProgress,
} from "@/lib/fixtures/content";

/**
 * The product surfaces, built from the fixtures in `lib/fixtures/content.ts`.
 *
 * The copy on this page is English literals passed as props. That is not a
 * shortcut around AGENTS.md rule 7 — it is the rule working. None of these
 * components contain a string; they take their words from the caller, and in
 * the real app the caller will be next-intl instead of this file.
 */

/* -------------------------------------------------------------------------
   Demo formatters — stand-ins for next-intl's number and message formatting
   ------------------------------------------------------------------------- */

const hours = (minutes: number) =>
  minutes >= 60 ? `${Math.round(minutes / 60)} h` : `${minutes} min`;

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/**
 * Formatting happens here, on the server, and only strings travel onward.
 * In the real app next-intl replaces these helpers; the shape of what the
 * components receive does not change.
 */
const curriculumLabels: CurriculumLabels = {
  chapterProgress: Object.fromEntries(
    sampleChapters.map((chapter) => [
      chapter.id,
      `${chapter.lessons.filter((l) => l.completed).length} of ${chapter.lessons.length} lessons complete`,
    ])
  ),
  chapterCount: Object.fromEntries(
    sampleChapters.map((chapter) => [
      chapter.id,
      `${chapter.lessons.filter((l) => l.completed).length} / ${chapter.lessons.length}`,
    ])
  ),
  lessonDuration: Object.fromEntries(
    sampleChapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => [
        lesson.id,
        `${lesson.estimatedMinutes} min`,
      ])
    )
  ),
  completed: "Completed",
  freePreview: "Free",
  locked: "Included",
  unavailableInLocale: "FR only",
};

const quizBlock = sampleBlocks.find((b) => b.type === "quiz");
const flashcardsBlock = sampleBlocks.find((b) => b.type === "flashcards");

const lessonLabels: LessonBlockLabels = {
  // The chart renders on the server, so it can take real formatters.
  chart: {
    description:
      "EURUSD daily candles from 1 to 16 June 2026, with two annotated days.",
    formatPrice: (value) => value.toFixed(4),
    formatDate: (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`,
  },
  quiz: {
    positions:
      quizBlock?.type === "quiz"
        ? quizBlock.questions.map(
            (_, i) => `Question ${i + 1} of ${quizBlock.questions.length}`
          )
        : [],
    correct: "That's right",
    incorrect: "Not quite",
    next: "Next question",
    explanationHeading: "Explanation",
  },
  flashcards: {
    positions:
      flashcardsBlock?.type === "flashcards"
        ? flashcardsBlock.cards.map(
            (_, i) => `${i + 1} of ${flashcardsBlock.cards.length}`
          )
        : [],
    flip: "Turn the card over",
    previous: "Previous card",
    next: "Next card",
  },
  formatFileSize: (bytes) => `${Math.round(bytes / 1024)} KB`,
};

/* -------------------------------------------------------------------------
   Sections
   ------------------------------------------------------------------------- */

function CatalogShowcase() {
  return (
    <Section
      id="catalog"
      title="Catalog"
      hint="Udemy's information architecture without its commerce psychology. No price, no discount, no countdown, no rating, no student count, no instructor — ADR-0001 and ADR-0002. What is left is what the course actually contains."
    >
      <CourseGrid>
        {sampleCourses.map((course) => {
          const progress = sampleProgress.find((p) => p.courseId === course.id);

          return (
            <CourseCard
              key={course.id}
              course={course}
              progress={progress}
              href="#"
              labels={{
                duration: hours(course.estimatedMinutes),
                lessons: plural(course.lessonCount, "lesson", "lessons"),
                chapters: plural(course.chapterCount, "chapter", "chapters"),
                freePreview: course.hasFreePreview ? "Free preview" : undefined,
                locked:
                  course.accessState === "requires-subscription"
                    ? "Included"
                    : course.accessState === "requires-prerequisite"
                      ? "Later in the path"
                      : undefined,
                unavailableInLocale: course.availableLocales.includes("en")
                  ? undefined
                  : "French only",
                progress: progress
                  ? `${progress.lessonsCompleted} of ${progress.lessonsTotal} lessons complete`
                  : undefined,
                progressShort: progress
                  ? `${Math.round((progress.lessonsCompleted / progress.lessonsTotal) * 100)}% complete`
                  : undefined,
              }}
            />
          );
        })}
      </CourseGrid>
    </Section>
  );
}

function ProgressShowcase() {
  return (
    <Section
      id="progress"
      title="Progress"
      hint="One idea drawn at three scales — a track that fills, turning green only when the whole thing is done. No points, no streaks, no confetti: completion is marked, not applauded."
    >
      <div className="grid gap-8 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <code className="font-mono text-[11px] text-muted-foreground">
            ProgressBar — lesson and chapter
          </code>
          <ProgressBar completed={11} total={18} label="11 of 18 complete" />
          <ProgressBar completed={18} total={18} label="18 of 18 complete" />
          <ProgressBar completed={0} total={18} label="0 of 18 complete" />
        </div>

        <div className="flex flex-col gap-3">
          <code className="font-mono text-[11px] text-muted-foreground">
            ProgressRing — course card
          </code>
          <div className="flex items-center gap-4">
            <ProgressRing completed={11} total={18} label="11 of 18 complete" />
            <ProgressRing completed={18} total={18} label="18 of 18 complete" />
            <ProgressRing completed={3} total={18} label="3 of 18 complete" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <code className="font-mono text-[11px] text-muted-foreground">
            ProgressRail — position in a chapter
          </code>
          <ProgressRail
            label="Lesson 4 of 8 in this chapter"
            lessons={[
              { id: "1", completed: true },
              { id: "2", completed: true },
              { id: "3", completed: true },
              { id: "4", completed: false, current: true },
              { id: "5", completed: false },
              { id: "6", completed: false },
              { id: "7", completed: false },
              { id: "8", completed: false },
            ]}
          />
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3">
        <code className="font-mono text-[11px] text-muted-foreground">
          ConceptChip — mastery attaches here, never to a lesson (ADR-0004)
        </code>
        <div className="flex flex-wrap gap-2">
          {sampleConcepts.map((concept, i) => (
            <ConceptChip key={concept.id} known={i < 2}>
              {concept.name}
            </ConceptChip>
          ))}
        </div>
      </div>
    </Section>
  );
}

function CurriculumShowcase() {
  return (
    <Section
      id="curriculum"
      title="Curriculum"
      hint="Always obvious where you are, what is next, and how much is left — a beginner's core fear is being lost. Every lesson states plainly whether it is finished, free, locked, or simply not written in this language yet."
    >
      <div className="measure-wide rounded-xl border border-border bg-card p-5">
        <Curriculum
          chapters={sampleChapters}
          labels={curriculumLabels}
          locale="en"
          currentLessonId="l4"
          defaultOpenChapterIds={["ch1", "ch2", "ch3"]}
        />
      </div>
    </Section>
  );
}

function LessonShowcase() {
  return (
    <Section
      id="lesson"
      title="Lesson"
      hint="All ten v1 block types from docs/content-model.md, in the order of the worked example. The chart is data rendered as SVG on the server, not an image — its annotations are translatable and its numbers are fixable without re-exporting an asset."
    >
      <article className="rounded-xl border border-border bg-card px-6 py-8 md:px-10">
        {/* Texts reveal: the eyebrow, title and meta rise and unblur with a
            40ms stagger, so the eye lands on the title first. Scoped to the
            header only — a stagger that runs down the whole page stops being a
            reveal and becomes a page-load animation. */}
        <header className="measure-prose animate-texts-reveal">
          <p className="font-mono text-xs tracking-wide text-accent uppercase">
            Reading a price chart · Chapter 2
          </p>
          <h2 className="mt-2 font-heading text-display font-semibold text-foreground">
            Anatomy of a candlestick
          </h2>
          <MetaRow className="mt-3">
            <MetaStat icon={BookOpen}>Lesson 1 of 3</MetaStat>
            <MetaStat>
              <span data-numeric>16 min</span>
            </MetaStat>
          </MetaRow>
          <div className="mt-4 flex flex-wrap gap-2">
            <ConceptChip>Candlestick anatomy</ConceptChip>
            <ConceptChip known>Chart basics</ConceptChip>
          </div>
        </header>

        <LessonBlocks blocks={sampleBlocks} labels={lessonLabels} className="mt-2" />
      </article>
    </Section>
  );
}

function StatesShowcase() {
  return (
    <Section
      id="states"
      title="States"
      hint="Designed together, shipped together. Locked especially — a subscription product shows it constantly, so it is a destination with a real argument, never a redirect and never a disabled button."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <EmptyState
          icon={Compass}
          title="You have not started anything yet"
          description="Everything is included. Foundations is where most people begin."
          action={<Button size="sm">Browse the catalog</Button>}
        />

        <ErrorStateDemo />

        <UnavailableInLocaleState
          title="Not yet in English"
          description="This lesson is published in French. The English translation is being written."
          action={
            <Button variant="outline" size="sm">
              Read it in French
            </Button>
          }
        />

        <LockedState
          title="This lesson is included with a subscription"
          description="One price, everything on the site. No per-course purchases."
          included={[
            "Every course, present and future",
            "Both languages",
            "Cancel any time",
          ]}
          action={<Button size="sm">See what is included</Button>}
          secondaryAction={
            <Button variant="ghost" size="sm">
              Read a free lesson first
            </Button>
          }
        />
      </div>
    </Section>
  );
}

function LoadingShowcase() {
  return (
    <Section
      id="loading"
      title="Loading"
      hint="Layout-identical to the real thing, component-level rather than route-level, and never covering the shell. A skeleton that shifts the layout is worse than a spinner."
    >
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <code className="font-mono text-[11px] text-muted-foreground">
            CourseGridSkeleton — three placeholders, never a guess at the real count
          </code>
          <CourseGridSkeleton count={3} />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <code className="font-mono text-[11px] text-muted-foreground">
              CurriculumSkeleton
            </code>
            <CurriculumSkeleton chapters={3} />
          </div>
          <div className="flex flex-col gap-3">
            <code className="font-mono text-[11px] text-muted-foreground">
              LessonSkeleton
            </code>
            <LessonSkeleton />
          </div>
        </div>
      </div>
    </Section>
  );
}

export {
  CatalogShowcase,
  CurriculumShowcase,
  LessonShowcase,
  LoadingShowcase,
  ProgressShowcase,
  StatesShowcase,
};
