"use client";

import { useParams } from "next/navigation";
import { useTransition } from "react";

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
 * the reader is looking at (`/fr/compte`). Passing that back to `router.replace`
 * with a different locale produces that locale's URL — `/en/account`. Doing
 * this with `next/navigation`'s `usePathname` would put `/fr/compte` under an
 * `/en` prefix and 404.
 *
 * `params` is forwarded so dynamic routes keep their slug across the switch.
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
  const [pending, startTransition] = useTransition();

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
      {routing.locales.map((locale) => {
        const selected = params.locale === locale;

        return (
          <button
            key={locale}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => switchTo(locale)}
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
