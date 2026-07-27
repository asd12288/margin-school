"use client";

import * as React from "react";
import { useParams } from "next/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface LocaleSwitcherLabels {
  /** Accessible name for the group, e.g. "Language". */
  group: string;
  fr: string;
  en: string;
}

/**
 * Switches language without leaving the page.
 *
 * The trick that makes translated segments work: `usePathname` from
 * i18n/navigation returns the **canonical** route (`/account`), not the URL
 * the reader is looking at (`/fr/compte`). Passing that back to
 * `router.replace` with a different locale produces that locale's URL —
 * `/en/account`. Doing this with `next/navigation`'s `usePathname` would put
 * `/fr/compte` under an `/en` prefix and 404.
 *
 * `params` is forwarded so dynamic routes keep their slug across the switch.
 *
 * The keyboard model is the ARIA radio pattern, and it is not decoration: a
 * radiogroup is one tab stop, and arrow keys move between options. Declaring
 * the role without the roving tabindex below would announce "radio, 1 of 2"
 * to a screen reader and then ignore the arrow key they press next.
 */
function LocaleSwitcher({
  labels,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  labels: LocaleSwitcherLabels;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = React.useTransition();
  const buttons = React.useRef<Array<HTMLButtonElement | null>>([]);

  // Falls back to the first option if the URL carries no recognisable locale,
  // so the group always has exactly one tab stop rather than becoming
  // unreachable by keyboard.
  const current = routing.locales.indexOf(params.locale as Locale);
  const activeIndex = current === -1 ? 0 : current;

  function switchTo(locale: Locale) {
    startTransition(() => {
      // The cast is next-intl's documented shape for forwarding dynamic
      // params: `pathname` carries `[course]`, `params` carries its value.
      router.replace(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { pathname, params: params as any },
        { locale }
      );
    });
  }

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp";
    if (!forward && !back) return;

    event.preventDefault();

    const count = routing.locales.length;
    const next = (index + (forward ? 1 : -1) + count) % count;

    buttons.current[next]?.focus();
    switchTo(routing.locales[next]);
  }

  return (
    <div
      role="radiogroup"
      aria-label={labels.group}
      data-pending={pending}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-4xl border border-border bg-muted p-0.5",
        "data-[pending=true]:opacity-70 transition-opacity duration-fast ease-quiet",
        className
      )}
      {...props}
    >
      {routing.locales.map((locale, index) => {
        const selected = index === activeIndex;

        return (
          <button
            key={locale}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            // Roving tabindex: one tab stop for the whole group.
            tabIndex={selected ? 0 : -1}
            onClick={() => switchTo(locale)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "rounded-4xl px-2.5 py-1 text-xs outline-none",
              "transition-[background-color,color] duration-fast ease-quiet",
              "focus-visible:ring-3 focus-visible:ring-ring/50",
              selected
                ? "bg-background text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {labels[locale]}
          </button>
        );
      })}
    </div>
  );
}

export { LocaleSwitcher };
