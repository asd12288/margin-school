"use client";

import * as React from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizBlock, QuizQuestion } from "@/lib/fixtures/content";

/**
 * The quiz block.
 *
 * Optimistic by construction (Tier 3 in docs/ux-architecture.md): the answer
 * is marked the instant it is clicked and the explanation opens with it. The
 * attempt is written to the server afterwards; nothing waits on a round trip
 * and there is no spinner.
 *
 * Tone matters more here than anywhere else in the product. A wrong answer is
 * where a nervous beginner decides whether this subject is for them, so being
 * wrong is marked plainly and immediately followed by the explanation — no
 * buzzer, no score, no streak broken. Being right is acknowledged once and
 * quietly.
 *
 * Answering writes `question_attempt` and updates `concept_mastery` for the
 * concepts this question tests — mastery attaches to concepts, never to the
 * lesson (ADR-0004).
 */

/**
 * Plain strings only — this is a client component, and functions cannot cross
 * the server/client boundary as props. `positions` is one pre-formatted string
 * per question ("Question 1 of 3", …), built on the server where next-intl
 * lives.
 */
export interface QuizLabels {
  /** One entry per question, in order. */
  positions: string[];
  correct: string;
  incorrect: string;
  next: string;
  /** Announced to screen readers when an answer is marked. */
  explanationHeading: string;
}

function QuizQuestionView({
  question,
  index,
  labels,
  onAnswered,
}: {
  question: QuizQuestion;
  index: number;
  labels: QuizLabels;
  onAnswered?: (optionId: string, correct: boolean) => void;
}) {
  const [chosen, setChosen] = React.useState<string | null>(null);
  const answered = chosen !== null;
  const wasCorrect = question.options.find((o) => o.id === chosen)?.correct;

  function choose(optionId: string, correct: boolean) {
    if (answered) return;
    setChosen(optionId);
    onAnswered?.(optionId, correct);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span
          data-numeric
          className="font-mono text-xs tracking-wide text-muted-foreground"
        >
          {labels.positions[index]}
        </span>
        <p className="font-heading text-base font-semibold text-foreground">
          {question.prompt}
        </p>
      </div>

      <div role="group" className="flex flex-col gap-2">
        {question.options.map((option) => {
          const isChosen = chosen === option.id;
          // Once answered, the correct option is always revealed — the point
          // is to learn the answer, not to preserve the puzzle.
          const reveal = answered && option.correct;

          return (
            <button
              key={option.id}
              type="button"
              disabled={answered}
              aria-pressed={isChosen}
              onClick={() => choose(option.id, option.correct)}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left text-sm",
                "transition-[background-color,border-color,transform] duration-fast ease-quiet",
                "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                !answered &&
                  "border-border bg-card hover:-translate-y-px hover:border-border-strong hover:bg-muted",
                reveal && "border-success/35 bg-success-muted",
                answered &&
                  isChosen &&
                  !option.correct &&
                  "animate-error-shake border-destructive/35 bg-destructive-muted",
                answered && !isChosen && !option.correct && "opacity-55",
                answered && "cursor-default"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-4xl border",
                  "transition-colors duration-fast ease-quiet",
                  reveal &&
                    "animate-success-check border-transparent bg-success text-success-foreground",
                  isChosen &&
                    !option.correct &&
                    "border-transparent bg-destructive text-destructive-foreground",
                  !answered && "border-border-strong",
                  answered && !isChosen && !option.correct && "border-border"
                )}
              >
                {reveal ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : isChosen && !option.correct ? (
                  <X className="size-3" strokeWidth={3} />
                ) : null}
              </span>
              <span className="grow">{option.text}</span>
            </button>
          );
        })}
      </div>

      {answered ? (
        <div
          role="status"
          className={cn(
            "flex flex-col gap-1.5 rounded-lg border-l-2 py-1 pl-3.5",
            "animate-in fade-in-0 slide-in-from-top-1 duration-base ease-quiet",
            wasCorrect ? "border-l-success" : "border-l-destructive"
          )}
        >
          <span
            className={cn(
              "text-xs font-semibold tracking-wide uppercase",
              wasCorrect ? "text-success" : "text-destructive"
            )}
          >
            {wasCorrect ? labels.correct : labels.incorrect}
          </span>
          <p className="text-prose-sm text-muted-foreground">
            <span className="sr-only">{labels.explanationHeading}: </span>
            {question.explanation}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Quiz({
  block,
  labels,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  block: QuizBlock;
  labels: QuizLabels;
}) {
  const [index, setIndex] = React.useState(0);
  const question = block.questions[index];
  const isLast = index === block.questions.length - 1;
  const [answeredIds, setAnsweredIds] = React.useState<string[]>([]);
  const answered = answeredIds.includes(question.id);

  return (
    <div
      data-slot="quiz-block"
      className={cn(
        "measure-prose my-8 rounded-xl border border-border bg-card p-5 shadow-card",
        className
      )}
      {...props}
    >
      <QuizQuestionView
        // Remount per question so local answer state resets cleanly.
        key={question.id}
        question={question}
        index={index}
        labels={labels}
        onAnswered={() => setAnsweredIds((ids) => [...ids, question.id])}
      />

      {answered && !isLast ? (
        <div className="mt-5 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIndex((i) => i + 1)}
          >
            {labels.next}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export { Quiz };
