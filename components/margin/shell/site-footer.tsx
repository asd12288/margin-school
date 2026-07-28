import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { CookiePreferencesButton } from "./cookie-preferences-button";
import { LocaleSwitcher, type LocaleSwitcherLabels } from "./locale-switcher";
import { Logo } from "./logo";

export interface SiteFooterLabels {
  brand: string;
  /** One line under the wordmark saying what the product is. */
  tagline: string;
  /** Required surface: educational content only, never advice. See product.md. */
  disclaimer: string;
  columns: {
    learn: { heading: string; courses: string; concepts: string };
    company: {
      heading: string;
      about: string;
      pricing: string;
      help: string;
    };
    legal: {
      heading: string;
      terms: string;
      privacy: string;
      mentions: string;
      accessibility: string;
    };
  };
  /** Already carries the year — see lib/shell-labels.ts. */
  copyright: string;
  cookiePreferences: string;
  locale: LocaleSwitcherLabels;
}

const footerLinkClassName =
  "rounded-4xl text-sm text-muted-foreground outline-none " +
  "transition-colors duration-fast ease-quiet hover:text-foreground " +
  "focus-visible:ring-3 focus-visible:ring-ring/50";

// Small caps rather than `text-sm font-semibold`: at the same size and weight
// as the links beneath them, the headings read as a fourth link in each column
// instead of as its label. Dropping a step and adding tracking separates the
// two roles without adding a colour or a rule.
const footerHeadingClassName =
  "text-xs font-semibold uppercase tracking-wide text-foreground";

/**
 * Public footer.
 *
 * Structure borrows Udemy's shape — a brand block, then link columns, then a
 * bottom bar with copyright, a cookie control and a language control — but
 * not its content. **Every link here goes to a route that actually exists.**
 * That is a standing rule for this file, not an observation about today: an
 * earlier revision of this branch spent real effort deleting links that
 * pointed at nothing, and `/about`, `/pricing`, `/concepts` and `/help` were
 * built as placeholder frames precisely so this footer could name them
 * honestly.
 *
 * ## No account column
 *
 * The previous version had one, with "Sign in" and "Start free trial" — and
 * rendered it unconditionally, so a signed-in subscriber was pitched a free
 * trial at the bottom of every page they visited. `tests/e2e/shell.spec.ts`
 * caught it as a duplicate CTA; the underlying problem is that it made the
 * footer a *second* place the shell had an opinion about the session, when
 * `AccountSlot` is documented as the only one.
 *
 * Dropping the column fixes both at once and is also the more faithful
 * borrowing: Udemy's own footer has no sign-in link either. The header
 * carries the trial CTA, session-aware, in the one place that already streams.
 *
 * ## The disclaimer is not decoration
 *
 * docs/product.md is explicit that this is a compliance surface: educational
 * content only, never advice, never signals. It belongs on every public page,
 * which is why it lives in the shell rather than on the pages that happen to
 * remember it. It sits in its own full-width band above the bottom bar so it
 * reads as a statement rather than as fine print in a column.
 *
 * ## Accessibility
 *
 * Each column is a `<nav>` with its own accessible name via `aria-labelledby`,
 * so a screen reader announces "Learn, navigation" and so on rather than three
 * unlabelled lists indistinguishable from the main nav landmark. The headings
 * are real `<h2>`s for the same reason — the columns are sections of the
 * document, not styled text.
 */
function SiteFooter({ labels }: { labels: SiteFooterLabels }) {
  return (
    <footer className="mt-16 border-t border-border bg-subtle">
      {/* Three steps, because two are not enough. One column on a phone
          stacks four blocks into a very tall footer; four columns do not fit
          until `md`. The `sm` pair is what stops the tablet range from
          inheriting the phone layout. The brand block spans both columns
          there so its tagline is not squeezed into half a phone's width. */}
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-8">
        {/* Brand block. Wider than the link columns on purpose: at equal
            widths the tagline wraps to four ragged lines. */}
        <div className="flex flex-col items-start gap-3 sm:col-span-2 md:col-span-1">
          <Logo alt={labels.brand} className="h-7" />
          <p className="measure-narrow text-sm text-muted-foreground">
            {labels.tagline}
          </p>
        </div>

        <nav aria-labelledby="footer-learn-heading">
          <h2 id="footer-learn-heading" className={footerHeadingClassName}>
            {labels.columns.learn.heading}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <Link href="/courses" className={footerLinkClassName}>
                {labels.columns.learn.courses}
              </Link>
            </li>
            <li>
              <Link href="/concepts" className={footerLinkClassName}>
                {labels.columns.learn.concepts}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-company-heading">
          <h2 id="footer-company-heading" className={footerHeadingClassName}>
            {labels.columns.company.heading}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <Link href="/about" className={footerLinkClassName}>
                {labels.columns.company.about}
              </Link>
            </li>
            <li>
              <Link href="/pricing" className={footerLinkClassName}>
                {labels.columns.company.pricing}
              </Link>
            </li>
            <li>
              <Link href="/help" className={footerLinkClassName}>
                {labels.columns.company.help}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-legal-heading">
          <h2 id="footer-legal-heading" className={footerHeadingClassName}>
            {labels.columns.legal.heading}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <Link
                href={{ pathname: "/legal/[doc]", params: { doc: "terms" } }}
                className={footerLinkClassName}
              >
                {labels.columns.legal.terms}
              </Link>
            </li>
            <li>
              <Link
                href={{ pathname: "/legal/[doc]", params: { doc: "privacy" } }}
                className={footerLinkClassName}
              >
                {labels.columns.legal.privacy}
              </Link>
            </li>
            <li>
              <Link
                href={{ pathname: "/legal/[doc]", params: { doc: "mentions" } }}
                className={footerLinkClassName}
              >
                {labels.columns.legal.mentions}
              </Link>
            </li>
            <li>
              <Link
                href={{
                  pathname: "/legal/[doc]",
                  params: { doc: "accessibility" },
                }}
                className={footerLinkClassName}
              >
                {labels.columns.legal.accessibility}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* One band, not two. The disclaimer and the copyright row were
          previously separated by a third horizontal rule, which gave the
          footer more lines than it has ideas — spacing separates them just as
          clearly and leaves the rules meaning something. */}
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
          <p className="measure-prose text-xs text-muted-foreground">
            {labels.disclaimer}
          </p>

          <div
            className={cn(
              "flex flex-col gap-4",
              "sm:flex-row sm:items-center sm:justify-between"
            )}
          >
            <span className="text-xs text-muted-foreground">
              {labels.copyright}
            </span>

            <div className="flex items-center gap-3">
              <CookiePreferencesButton label={labels.cookiePreferences} />
              <LocaleSwitcher labels={labels.locale} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { SiteFooter };
