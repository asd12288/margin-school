import { cn } from "@/lib/utils";

/**
 * Keyboard bypass to main content — the first focusable thing on the page,
 * invisible until focused. WCAG 2.4.1.
 *
 * Positioned rather than hidden: `display: none` would take it out of the
 * focus order entirely, which is the usual way this control gets shipped
 * broken.
 */
function SkipLink({
  label,
  targetId = "main",
  className,
  ...props
}: Omit<React.ComponentProps<"a">, "href"> & {
  label: string;
  targetId?: string;
}) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "sr-only focus:not-sr-only",
        "focus:absolute focus:left-4 focus:top-4 focus:z-50",
        "focus:rounded-4xl focus:bg-background focus:px-4 focus:py-2",
        "focus:text-sm focus:font-medium focus:text-foreground",
        "focus:ring-3 focus:ring-ring/50",
        className
      )}
      {...props}
    >
      {label}
    </a>
  );
}

export { SkipLink };
