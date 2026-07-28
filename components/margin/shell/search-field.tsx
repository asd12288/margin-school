import { Search } from "lucide-react";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface SearchFieldLabels {
  /** Accessible name for the input, e.g. "Search courses". */
  label: string;
  placeholder: string;
}

/**
 * A real `<form>`, not a decorative box: submitting a `GET` to the catalog
 * with `q` set is the entire mechanism, so it works before any client JS has
 * hydrated and needs none to keep working. That is why this stays a server
 * component — nothing here needs `useState` or an event handler.
 *
 * The action is built with `getPathname`, never a hardcoded path, so it lands
 * on `/fr/catalogue` in French and `/en/courses` in English — the same
 * locale-aware pathname translation every other link in the shell goes
 * through (`i18n/navigation.ts`).
 *
 * `locale` arrives as a prop rather than being read internally: this keeps
 * the component usable from either shell's header without assuming which
 * locale segment it is rendered under.
 *
 * The catalog reads the `q` this submits — see `CourseResults` in
 * `app/[locale]/(public)/courses/page.tsx`, which filters inside its own
 * `<Suspense>` boundary so the search never costs the page its Tier 1 frame.
 *
 * **Width is the caller's call.** This used to hard-code `max-w-48`, on the
 * argument that a narrow box suits a guided path better than a marketplace
 * search bar. The public header now gives it the full centre column
 * instead — search is the one thing a visitor arriving from a query already
 * knows how to use. The footprint is a layout decision, so it lives with the
 * layout; this component just fills what it is given.
 */
function SearchField({
  locale,
  labels,
  defaultValue,
  className,
}: {
  locale: Locale;
  labels: SearchFieldLabels;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <form
      method="GET"
      action={getPathname({ href: "/courses", locale })}
      role="search"
      className={cn("w-full", className)}
    >
      {/*
       * Pill, not the vendored `rounded-lg` — every other control in the
       * header (locale, theme, the trial button, the account menu) is a pill,
       * and a single squared field in that row was the one shape that did not
       * belong. Taller than stock too: `InputGroup` is `h-8`, which reads as
       * an afterthought inside a 4rem header bar.
       *
       * Filled rather than outlined for the same reason a search bar usually
       * is — the header sits on `bg-background/80`, so a field that is only a
       * border nearly disappears against it. `bg-muted` gives it a body at
       * rest; focus is already handled by the group's own ring.
       */}
      <InputGroup className="h-10 rounded-4xl border-transparent bg-muted ps-1 transition-colors duration-fast ease-quiet hover:bg-subtle has-[[data-slot=input-group-control]:focus-visible]:bg-background">
        <InputGroupAddon>
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={labels.placeholder}
          aria-label={labels.label}
        />
      </InputGroup>
    </form>
  );
}

export { SearchField };
