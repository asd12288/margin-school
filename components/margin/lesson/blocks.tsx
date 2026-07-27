import * as React from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  Info,
  Lightbulb,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

import { CandlestickChart, type CandlestickChartLabels } from "./candlestick-chart";
import { Flashcards, type FlashcardsLabels } from "./flashcards";
import { Quiz, type QuizLabels } from "./quiz";
import { cn } from "@/lib/utils";
import type {
  Block,
  CalloutBlock,
  ExampleBlock,
  ExerciseBlock,
  HeadingBlock,
  ImageBlock,
  ResourceBlock,
  TextBlock,
} from "@/lib/fixtures/content";

/**
 * Renderers for the v1 block types in docs/content-model.md.
 *
 * A lesson is an ordered list of typed blocks, one row each. `LessonBlocks`
 * walks that list and dispatches on `type`; every block type has exactly one
 * renderer and no block type renders itself differently depending on where it
 * sits. That is what keeps the reading experience consistent as the content
 * author invents new combinations.
 *
 * Everything is sized to the reading measure except the chart and the image,
 * which are allowed to breathe a little wider — a figure that matches the
 * text column exactly reads as cramped.
 */

/* -------------------------------------------------------------------------
   Heading and text
   ------------------------------------------------------------------------- */

function HeadingBlockView({ block }: { block: HeadingBlock }) {
  const Tag = block.level === 2 ? "h2" : "h3";
  return (
    <Tag
      className={cn(
        "measure-prose font-heading text-foreground",
        block.level === 2
          ? "mt-12 mb-3 text-display-sm font-semibold"
          : "mt-9 mb-2 text-xl font-semibold"
      )}
    >
      {block.text}
    </Tag>
  );
}

function TextBlockView({ block }: { block: TextBlock }) {
  return (
    <div
      className="prose-lesson measure-prose"
      // Authored in our own admin by our own content team and stored as
      // trusted HTML. If block payloads ever accept outside input, this needs
      // sanitising at the write boundary, not here.
      dangerouslySetInnerHTML={{ __html: block.html }}
    />
  );
}

/* -------------------------------------------------------------------------
   Image
   ------------------------------------------------------------------------- */

function ImageBlockView({ block }: { block: ImageBlock }) {
  return (
    <figure className="measure-wide my-8">
      <div
        className="relative overflow-hidden rounded-xl border border-border bg-muted"
        style={{ aspectRatio: block.aspectRatio }}
      >
        <Image
          src={block.src}
          alt={block.alt}
          fill
          sizes="(max-width: 768px) 100vw, 720px"
          className="object-cover"
        />
      </div>
      {block.caption ? (
        <figcaption className="mt-3 border-t border-border pt-2.5 text-xs text-muted-foreground">
          {block.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/* -------------------------------------------------------------------------
   Callout
   ------------------------------------------------------------------------- */

const calloutTones: Record<
  CalloutBlock["tone"],
  { icon: LucideIcon; frame: string; accent: string }
> = {
  note: {
    icon: Info,
    frame: "border-l-info bg-info-muted/50",
    accent: "text-info",
  },
  tip: {
    icon: Lightbulb,
    frame: "border-l-success bg-success-muted/50",
    accent: "text-success",
  },
  warning: {
    icon: AlertTriangle,
    frame: "border-l-warning bg-warning-muted/50",
    accent: "text-warning",
  },
  // Not decoration: educational content carries mandatory risk disclaimers,
  // and this is the one callout that must never be visually skippable.
  risk: {
    icon: ShieldAlert,
    frame: "border-l-destructive bg-destructive-muted/50",
    accent: "text-destructive",
  },
};

function CalloutBlockView({ block }: { block: CalloutBlock }) {
  const tone = calloutTones[block.tone];
  const Icon = tone.icon;

  return (
    <aside
      data-slot="callout"
      data-tone={block.tone}
      className={cn(
        "measure-prose my-7 rounded-r-lg border-l-2 py-4 pr-4 pl-4",
        tone.frame
      )}
    >
      <p
        className={cn(
          "flex items-center gap-2 text-xs font-semibold tracking-wide uppercase",
          tone.accent
        )}
      >
        <Icon className="size-3.5" />
        {block.title}
      </p>
      <p className="mt-2 text-prose-sm text-foreground">
        {block.body}
      </p>
    </aside>
  );
}

/* -------------------------------------------------------------------------
   Example
   ------------------------------------------------------------------------- */

/** A worked example. Set in mono-adjacent framing so the eye knows it is
 *  arithmetic to follow rather than prose to absorb. */
function ExampleBlockView({ block }: { block: ExampleBlock }) {
  return (
    <div className="measure-prose my-7 rounded-xl border border-dashed border-border-strong bg-muted/40 p-5">
      <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
        {block.title}
      </p>
      <p className="mt-2.5 text-prose-sm text-foreground">
        {block.body}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Exercise
   ------------------------------------------------------------------------- */

function ExerciseBlockView({ block }: { block: ExerciseBlock }) {
  return (
    <div className="measure-prose my-8 rounded-xl border border-accent/25 bg-accent-muted/40 p-5">
      <p className="font-heading text-base font-semibold text-foreground">
        {block.title}
      </p>
      <p className="mt-1.5 text-prose-sm text-muted-foreground">
        {block.instructions}
      </p>
      <ol className="mt-4 flex flex-col gap-2.5">
        {block.steps.map((step, i) => (
          <li key={i} className="flex items-baseline gap-3 text-sm">
            <span
              aria-hidden
              data-numeric
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-4xl",
                "bg-accent font-mono text-3xs font-semibold text-accent-foreground"
              )}
            >
              {i + 1}
            </span>
            <span className="text-foreground">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Resource
   ------------------------------------------------------------------------- */

function ResourceBlockView({
  block,
  sizeLabel,
}: {
  block: ResourceBlock;
  /** Formatted file size, e.g. "180 KB". Undefined for links. */
  sizeLabel?: string;
}) {
  const External = block.kind === "link";
  const Icon = External ? ExternalLink : Download;

  return (
    <a
      href={block.href}
      data-slot="resource-block"
      className={cn(
        "measure-prose group my-7 flex items-center gap-4 rounded-xl border border-border",
        "bg-card p-4 no-underline shadow-card outline-none",
        "transition-[border-color,box-shadow,transform] duration-base ease-quiet",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-raised",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 grow">
        <span className="block text-sm font-medium text-card-foreground">
          {block.title}
        </span>
        <span className="block text-xs text-muted-foreground">
          {block.description}
        </span>
      </span>
      {sizeLabel ? (
        <span
          data-numeric
          className="shrink-0 font-mono text-xs text-muted-foreground"
        >
          {sizeLabel}
        </span>
      ) : null}
    </a>
  );
}

/* -------------------------------------------------------------------------
   Dispatcher
   ------------------------------------------------------------------------- */

export interface LessonBlockLabels {
  chart: CandlestickChartLabels;
  quiz: QuizLabels;
  flashcards: FlashcardsLabels;
  /** Formats a resource's byte size. */
  formatFileSize: (bytes: number) => string;
}

function LessonBlocks({
  blocks,
  labels,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  blocks: Block[];
  labels: LessonBlockLabels;
}) {
  return (
    <div data-slot="lesson-blocks" className={cn("w-full", className)} {...props}>
      {[...blocks]
        // Explicit integer position, never array index — see the invariants
        // in docs/content-model.md.
        .sort((a, b) => a.position - b.position)
        .map((block) => {
          switch (block.type) {
            case "heading":
              return <HeadingBlockView key={block.id} block={block} />;
            case "text":
              return <TextBlockView key={block.id} block={block} />;
            case "image":
              return <ImageBlockView key={block.id} block={block} />;
            case "callout":
              return <CalloutBlockView key={block.id} block={block} />;
            case "example":
              return <ExampleBlockView key={block.id} block={block} />;
            case "chart":
              return (
                <CandlestickChart
                  key={block.id}
                  block={block}
                  labels={labels.chart}
                />
              );
            case "quiz":
              return <Quiz key={block.id} block={block} labels={labels.quiz} />;
            case "flashcards":
              return (
                <Flashcards
                  key={block.id}
                  block={block}
                  labels={labels.flashcards}
                />
              );
            case "exercise":
              return <ExerciseBlockView key={block.id} block={block} />;
            case "resource":
              return (
                <ResourceBlockView
                  key={block.id}
                  block={block}
                  sizeLabel={
                    block.sizeBytes
                      ? labels.formatFileSize(block.sizeBytes)
                      : undefined
                  }
                />
              );
          }
        })}
    </div>
  );
}

export {
  CalloutBlockView,
  ExampleBlockView,
  ExerciseBlockView,
  HeadingBlockView,
  ImageBlockView,
  LessonBlocks,
  ResourceBlockView,
  TextBlockView,
};
