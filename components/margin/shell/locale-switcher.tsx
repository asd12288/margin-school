"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { useParams } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface LocaleSwitcherLabels {
  /**
   * Accessible name for the trigger, already stating the active language —
   * e.g. "Current language: English" / "Langue actuelle : Français". Built
   * server-side in `lib/shell-labels.ts`, where the active locale is known,
   * so the component never has to assemble a sentence out of a template.
   */
  current: string;
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
 * Keyboard behaviour used to be hand-rolled (roving tabindex, arrow keys) to
 * satisfy the ARIA radiogroup pattern the old segmented control needed.
 * `DropdownMenu`'s `RadioGroup`/`RadioItem` give the same `menuitemradio`
 * semantics and correct arrow-key navigation natively, so none of that
 * survives here — moving to a menu was the point.
 */
function LocaleSwitcher({
  labels,
  className,
}: {
  labels: LocaleSwitcherLabels;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = React.useTransition();

  // Falls back to the routing default if the URL carries no recognisable
  // locale, so the radio group always has a defined `value`.
  const current = routing.locales.includes(params.locale as Locale)
    ? (params.locale as Locale)
    : routing.defaultLocale;

  function switchTo(locale: Locale) {
    startTransition(() => {
      router.replace(
        // The cast is next-intl's documented shape for forwarding dynamic
        // params: `pathname` carries `[course]`, `params` carries its value.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { pathname, params: params as any },
        { locale }
      );
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={labels.current}
        data-pending={pending}
        className={cn(
          "flex size-8 items-center justify-center rounded-4xl border border-border bg-muted text-muted-foreground outline-none transition-colors duration-fast ease-quiet hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
          "data-[pending=true]:opacity-70",
          className
        )}
      >
        <Globe className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(value) => switchTo(value as Locale)}
        >
          {routing.locales.map((locale) => (
            <DropdownMenuRadioItem key={locale} value={locale}>
              {labels[locale]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { LocaleSwitcher };
