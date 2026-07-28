import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { CookiePreferencesButton } from "./cookie-preferences-button";
import { LocaleSwitcher, type LocaleSwitcherLabels } from "./locale-switcher";

export interface SiteFooterLabels {
  brand: string;
  /** Required surface: educational content only, never advice. See product.md. */
  disclaimer: string;
  columns: {
    explore: { heading: string; courses: string };
    account: { heading: string; signIn: string; startTrial: string };
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

/**
 * Public footer.
 *
 * Structure borrows Udemy's shape — link columns, then a bottom bar with
 * brand, copyright, a cookie control and a language control — but not its
 * content. Every link here goes to a route that actually exists: the
 * catalog, sign-in/sign-up, and the four legal documents. No `/pricing`, no
 * `/concepts`, no `/about` — those are Phase 8, and this branch spent real
 * effort removing links that pointed at nothing.
 *
 * The risk disclaimer is not decoration. docs/product.md is explicit that
 * this is a compliance surface: educational content only, never advice,
 * never signals. It belongs on every public page, which is why it lives in
 * the shell rather than on the pages that happen to remember it.
 *
 * Each column is a `<nav>` with its own accessible name via
 * `aria-labelledby`, so a screen reader announces "Explore, navigation" and
 * so on rather than three unlabelled lists indistinguishable from the main
 * nav landmark.
 */
function SiteFooter({ labels }: { labels: SiteFooterLabels }) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <nav aria-labelledby="footer-explore-heading">
          <h2
            id="footer-explore-heading"
            className="text-sm font-semibold text-foreground"
          >
            {labels.columns.explore.heading}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <Link href="/courses" className={footerLinkClassName}>
                {labels.columns.explore.courses}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-account-heading">
          <h2
            id="footer-account-heading"
            className="text-sm font-semibold text-foreground"
          >
            {labels.columns.account.heading}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <Link href="/sign-in" className={footerLinkClassName}>
                {labels.columns.account.signIn}
              </Link>
            </li>
            <li>
              <Link href="/sign-up" className={footerLinkClassName}>
                {labels.columns.account.startTrial}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-legal-heading">
          <h2
            id="footer-legal-heading"
            className="text-sm font-semibold text-foreground"
          >
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

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
          <p className="measure-prose text-xs text-muted-foreground">
            {labels.disclaimer}
          </p>

          <div
            className={cn(
              "flex flex-col gap-4",
              "sm:flex-row sm:items-center sm:justify-between"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {labels.brand}
              </span>
              <span className="text-xs text-muted-foreground">
                {labels.copyright}
              </span>
            </div>

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
