"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

export interface ThemeSwitchLabels {
  /** Announces the action, not the state: "Switch to dark theme". */
  toDark: string;
  toLight: string;
}

/**
 * One button, two themes.
 *
 * Replaces the three-option dropdown that stood here. "Follow the system" is
 * gone from the UI, and that is a deliberate narrowing: a control with two
 * states does not need a menu, and a menu is two interactions (open, choose)
 * for something people flip on impulse.
 *
 * **`enableSystem` stays on in `components/theme-provider.tsx`.** Removing the
 * *option* is not the same as removing the *behaviour* — a first-time visitor
 * still lands in whichever theme their OS asks for, which is the right default
 * and the one nobody has to discover. What changes is that once someone
 * touches this button they have expressed a preference, and the app keeps it.
 * There is no route back to "follow the system" short of clearing storage;
 * that is the accepted cost of the simpler control.
 *
 * `resolvedTheme`, never `theme`. Before the first click `theme` is the string
 * `"system"`, which is neither of the two things this button toggles between —
 * reading it would make the first click a no-op half the time.
 *
 * The `mounted` guard exists because `next-themes` cannot know the theme until
 * it has read `localStorage`, which is after hydration. Rendering the sun
 * unconditionally would flash the wrong glyph on every cold load in dark mode.
 * `useSyncExternalStore` is the smallest correct guard: `false` on the server
 * and on the first client render, `true` after — matching what
 * `components/margin/theme-toggle.tsx` already does.
 */
function ThemeSwitch({
  labels,
  className,
}: {
  labels: ThemeSwitchLabels;
  className?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      // Before mount the theme is genuinely unknown, so the button claims the
      // light-theme default rather than asserting something that may be wrong
      // for one frame. It is never wrong about what it *does* — the click
      // handler reads the live value, not this one.
      aria-label={isDark ? labels.toLight : labels.toDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex size-8 items-center justify-center rounded-4xl border border-border bg-muted text-muted-foreground outline-none",
        "transition-colors duration-fast ease-quiet hover:text-foreground",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}

export { ThemeSwitch };
