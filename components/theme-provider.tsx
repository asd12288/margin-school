"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Light and dark are both first-class — people study in the evening, so dark
 * is a reading mode, not an afterthought. See docs/design-brief.md.
 *
 * `class` strategy rather than `prefers-color-scheme` alone: the preference
 * has to be user-settable, and shadcn's `dark:` variant is class-based.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
