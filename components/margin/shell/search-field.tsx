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
 * Reading the catalog's `q` parameter is a later task's job — this only has
 * to get it into the URL.
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
      // Deliberately narrower than the nav and the account controls: this
      // product's thesis is a guided path, not a marketplace search box.
      className={cn("w-full max-w-48", className)}
    >
      <InputGroup>
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
