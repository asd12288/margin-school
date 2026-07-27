export interface SiteFooterLabels {
  brand: string;
  /** Required surface: educational content only, never advice. See product.md. */
  disclaimer: string;
}

/**
 * The risk disclaimer is not decoration. docs/product.md is explicit that this
 * is a compliance surface: educational content only, never advice, never
 * signals. It belongs on every public page, which is why it lives in the shell
 * rather than on the pages that happen to remember it.
 */
function SiteFooter({ labels }: { labels: SiteFooterLabels }) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 sm:px-6">
        <p className="text-sm font-medium text-foreground">{labels.brand}</p>
        <p className="measure-prose text-xs text-muted-foreground">
          {labels.disclaimer}
        </p>
      </div>
    </footer>
  );
}

export { SiteFooter };
