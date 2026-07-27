"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

export interface ThemeToggleLabels {
  light: string;
  dark: string;
  system: string;
  /** Accessible name for the group, e.g. "Colour theme". */
  group: string;
}

/**
 * Light, dark, or follow the system.
 *
 * A three-way segmented control rather than a two-way switch, because
 * "follow the system" is a real preference and hiding it behind a long-press
 * is how people end up with a light app at midnight.
 *
 * `mounted` guards the first paint: the resolved theme is not knowable on the
 * server, so rendering the selected state before hydration would flash the
 * wrong segment. The control renders in place and unselected until then, so
 * nothing moves.
 */
function ThemeToggle({
  labels,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  labels: ThemeToggleLabels;
}) {
  const { theme, setTheme } = useTheme();

  // False during server render and the first client render, true afterwards.
  // `useSyncExternalStore` gets this without setting state inside an effect,
  // which would cost a cascading render on every mount.
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

  return (
    <div
      data-slot="theme-toggle"
      role="radiogroup"
      aria-label={labels.group}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-4xl border border-border bg-muted p-0.5",
        className
      )}
      {...props}
    >
      {options.map(({ value, icon: Icon, label }) => {
        const selected = mounted && theme === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex size-7 items-center justify-center rounded-4xl outline-none",
              "transition-[background-color,color] duration-fast ease-quiet",
              "focus-visible:ring-3 focus-visible:ring-ring/50",
              selected
                ? "bg-background text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

export { ThemeToggle };
