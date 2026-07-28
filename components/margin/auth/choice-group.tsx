"use client";

import {
  BookOpen,
  Check,
  CandlestickChart,
  Compass,
  Landmark,
  LineChart,
  ShieldCheck,
  Sprout,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Icons, looked up by name.
 *
 * A component cannot cross the server/client boundary as a prop, and these
 * labels are built on the server (`lib/auth/onboarding-labels.ts`). So the
 * server sends a **string** and this module resolves it — the same constraint
 * that made every other label in `components/margin/` a plain value.
 *
 * The names match the enum values in `lib/db/schema/profile.ts`, so adding a
 * goal means adding one entry here and the lookup cannot silently miss.
 */
const CHOICE_ICONS: Record<string, LucideIcon> = {
  // experience_level
  beginner: Sprout,
  intermediate: BookOpen,
  advanced: LineChart,
  // learning_goal
  understand_markets: Landmark,
  read_charts: CandlestickChart,
  manage_risk: ShieldCheck,
  build_strategy: Compass,
};

export interface Choice {
  value: string;
  label: string;
  /** Key into `CHOICE_ICONS`. Omitted for groups where an icon would be noise. */
  icon?: string;
}

/**
 * A group of radio cards.
 *
 * **Native `<input type="radio">`, not Radix's RadioGroup.** A native group
 * inside a `<fieldset>` already gives arrow-key navigation, the correct
 * announcement of "2 of 4", and — the reason that matters here — a form that
 * submits without JavaScript. Onboarding is blocking, so a JS-only control on
 * it is a JS-only door into the product.
 *
 * The input itself is visually hidden rather than `display: none`, because a
 * hidden input is not focusable and the keyboard behaviour goes with it. The
 * card is styled from `peer-checked:` and `peer-focus-visible:`, so the focus
 * ring lands on the card the user sees.
 *
 * **One line per choice, an icon instead of a sentence.** These cards carried
 * a description under every label; four questions each explaining themselves
 * turned a thirty-second form into a page of prose. The icon does the work the
 * description was doing — it distinguishes the options at a glance — without
 * adding a line of text to read.
 */
function ChoiceGroup({
  name,
  legend,
  choices,
  defaultValue,
  error,
  columns = 1,
}: {
  name: string;
  legend: string;
  choices: Choice[];
  defaultValue?: string;
  /** Already translated by the caller. */
  error?: string;
  columns?: 1 | 2 | 3;
}) {
  const errorId = `${name}-error`;

  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className="mb-3 text-sm font-medium text-foreground">{legend}</legend>

      <div
        className={cn(
          "grid gap-2",
          // One column on a phone in every case: two short labels fit side by
          // side, but French runs 15–20% longer than English and
          // "Comprendre le fonctionnement des marchés" does not.
          columns === 1 && "grid-cols-1",
          columns === 2 && "grid-cols-1 sm:grid-cols-2",
          columns === 3 && "grid-cols-1 sm:grid-cols-3",
        )}
      >
        {choices.map((choice) => {
          const Icon = choice.icon ? CHOICE_ICONS[choice.icon] : undefined;

          return (
            <label
              key={choice.value}
              className="group/choice relative flex cursor-pointer"
            >
              <input
                type="radio"
                name={name}
                value={choice.value}
                defaultChecked={defaultValue === choice.value}
                className="peer sr-only"
              />

              <span
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5",
                  "transition-[background-color,border-color] duration-fast ease-quiet",
                  "group-hover/choice:border-border-strong group-hover/choice:bg-muted",
                  "peer-checked:border-primary peer-checked:bg-primary-muted",
                  "peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40",
                  /*
                   * The checked styles for the icon and the tick are declared
                   * here, on the element that is actually the input's sibling,
                   * and reach down by descendant selector.
                   *
                   * `peer-checked:` compiles to `.peer:checked ~ &`, so
                   * writing it on the tick itself would generate a rule
                   * matching a *sibling* of the input — which the tick is not;
                   * it is a grandchild. The styles silently never applied.
                   */
                  "peer-checked:[&_[data-slot=choice-icon]]:text-primary-text",
                  "peer-checked:[&_[data-slot=tick]]:opacity-100",
                )}
              >
                {Icon ? (
                  <Icon
                    data-slot="choice-icon"
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground transition-colors duration-fast ease-quiet"
                  />
                ) : null}

                <span className="min-w-0 flex-1 text-sm text-foreground">
                  {choice.label}
                </span>

                {/*
                 * Drawn always and revealed by opacity rather than mounted on
                 * selection, so the card's height and the label's wrap point
                 * do not change when it is chosen.
                 */}
                <Check
                  data-slot="tick"
                  aria-hidden
                  className="size-4 shrink-0 text-primary opacity-0 transition-opacity duration-fast ease-quiet"
                  strokeWidth={3}
                />
              </span>
            </label>
          );
        })}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-xs text-destructive-text">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export { ChoiceGroup };
