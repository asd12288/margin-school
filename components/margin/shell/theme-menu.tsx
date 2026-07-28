"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ThemeToggleLabels } from "@/components/margin/theme-toggle";

/**
 * Reuses `ThemeToggleLabels` rather than declaring a parallel shape: the two
 * components say the same three things, `theme-toggle.tsx` is not being
 * touched, and `lib/shell-labels.ts` can hand the identical `labels.theme`
 * object to whichever one a page renders.
 */
export type ThemeMenuLabels = ThemeToggleLabels;

/**
 * Icon-button replacement for the segmented `ThemeToggle` in the shell.
 *
 * Same three options as `ThemeToggle`, same reason: docs/design-system.md
 * treats "follow the system" as a real preference, not an edge case worth
 * burying — the menu just keeps it one click away instead of a whole
 * segmented control's width.
 *
 * The `mounted` guard only has to cover the trigger's own icon. The dropdown
 * content — where the check mark lives — cannot be opened until the browser
 * has hydrated, so by the time a reader can see which option is checked,
 * `useTheme()` has already resolved. The always-visible trigger is the one
 * place a wrong guess would flash, exactly the problem `ThemeToggle` guards
 * against with the same `useSyncExternalStore` trick.
 */
function ThemeMenu({
  labels,
  className,
}: {
  labels: ThemeMenuLabels;
  className?: string;
}) {
  const { theme, setTheme } = useTheme();

  // False during server render and the first client render, true afterwards.
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const options = [
    { value: "light", icon: Sun, label: labels.light },
    { value: "dark", icon: Moon, label: labels.dark },
    { value: "system", icon: Monitor, label: labels.system },
  ] as const;

  const activeOption = mounted
    ? options.find((option) => option.value === theme)
    : undefined;
  // Falls back to the system glyph before mount and for an unrecognised
  // theme value, since `defaultTheme="system"` (components/theme-provider.tsx)
  // makes it the right guess for a first-time visitor.
  const TriggerIcon = activeOption?.icon ?? Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={labels.group}
        className={cn(
          "flex size-8 items-center justify-center rounded-4xl border border-border bg-muted text-muted-foreground outline-none transition-colors duration-fast ease-quiet hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        <TriggerIcon className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={theme ?? "system"}
          onValueChange={(value) => setTheme(value)}
        >
          {options.map(({ value, icon: Icon, label }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ThemeMenu };
