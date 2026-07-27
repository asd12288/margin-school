"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FlashcardsBlock } from "@/lib/fixtures/content";

/**
 * The flashcards block.
 *
 * Cards are first-class rows in the content model, not JSON buried inside
 * this block, because Phase 12 review sessions need to pull them
 * independently of the lesson they came from.
 *
 * The flip is the one place in the product with a genuinely three-dimensional
 * animation, and it earns it: turning a card over is the physical metaphor
 * the whole control is built on. It still runs at `--duration-slow` and
 * stops dead under `prefers-reduced-motion`, where the face simply swaps.
 */

/**
 * Plain strings only — this is a client component, and functions cannot cross
 * the server/client boundary as props. `positions` is one pre-formatted string
 * per card ("1 of 12", …), built on the server where next-intl lives.
 */
export interface FlashcardsLabels {
  /** One entry per card, in order. */
  positions: string[];
  /** Accessible name for the card button, e.g. "Turn the card over". */
  flip: string;
  previous: string;
  next: string;
}

function Flashcards({
  block,
  labels,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  block: FlashcardsBlock;
  labels: FlashcardsLabels;
}) {
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const card = block.cards[index];

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => (i + delta + block.cards.length) % block.cards.length);
  }

  return (
    <div
      data-slot="flashcards-block"
      className={cn("measure-prose my-8 flex flex-col gap-3", className)}
      {...props}
    >
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={labels.flip}
        aria-pressed={flipped}
        className={cn(
          "group relative h-44 w-full rounded-xl outline-none",
          "focus-visible:ring-3 focus-visible:ring-ring/50"
        )}
        style={{ perspective: "1200px" }}
      >
        <span
          className={cn(
            "relative block size-full transition-transform duration-slow ease-quiet",
            "motion-reduce:transition-none"
          )}
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateX(180deg)" : undefined,
          }}
        >
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-xl border border-border",
              "bg-card px-6 text-center shadow-card",
              "font-heading text-xl text-card-foreground",
              "transition-colors duration-fast ease-quiet group-hover:border-border-strong",
              // Under reduced motion the rotation never happens, so the front
              // has to be hidden explicitly when flipped.
              "motion-reduce:backface-visible",
              flipped && "motion-reduce:invisible"
            )}
            style={{ backfaceVisibility: "hidden" }}
          >
            {card.front}
          </span>
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-xl border",
              "border-primary/20 bg-primary-muted px-6 text-center shadow-card",
              "text-prose text-foreground",
              "motion-reduce:backface-visible",
              !flipped && "motion-reduce:invisible"
            )}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateX(180deg)",
            }}
          >
            {card.back}
          </span>
        </span>
      </button>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => go(-1)}
          aria-label={labels.previous}
        >
          <ChevronLeft />
        </Button>
        <span data-numeric className="font-mono text-xs text-muted-foreground">
          {labels.positions[index]}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => go(1)}
          aria-label={labels.next}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

export { Flashcards };
