import { cn } from "@/lib/utils";

export interface PlaceholderPageLabels {
  /** The badge, e.g. "Placeholder" / "Contenu provisoire". */
  badge: string;
  title: string;
  /** One paragraph saying what this page will hold once it is written. */
  description: string;
}

/**
 * The shape every not-yet-written public page takes.
 *
 * AGENTS.md rule 1 requires placeholder content to read as *obviously*
 * placeholder — a confident-looking About page that is not the real one is a
 * claim the brand has not earned yet. So the badge is not decoration and does
 * not get styled down: it is the first thing in the reading order, before the
 * heading, and it says the same thing in both languages.
 *
 * Four routes render this (`/about`, `/pricing`, `/concepts`, `/help`) and
 * `(public)/legal/[doc]` renders the same three elements inline. They are not
 * merged: the legal route sits inside a `use cache` scope with its own
 * `notFound()` branch, and pulling that through this component would put a
 * cache boundary inside a presentational one for no gain. If a fifth caller
 * appears, revisit.
 *
 * `<main>` lives here rather than in each page so the four callers cannot
 * drift on landmark structure — the skip link in both shells targets `#main`,
 * and a page that forgot the wrapper would silently break it.
 */
function PlaceholderPage({
  labels,
  className,
}: {
  labels: PlaceholderPageLabels;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6",
        className
      )}
    >
      <p className="inline-flex w-fit items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        {labels.badge}
      </p>
      <h1 className="mt-4 text-display font-bold tracking-tight text-foreground">
        {labels.title}
      </h1>
      <p className="measure-prose mt-3 text-prose text-muted-foreground">
        {labels.description}
      </p>
    </main>
  );
}

export { PlaceholderPage };
