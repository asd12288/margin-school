import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Placeholder home page.
 *
 * Replaces the create-next-app boilerplate, which shipped hardcoded hexes
 * (`#383838`, `#ccc`, `#1a1a1a`) and a one-off `w-[158px]` — every one of them
 * a violation of the token rule the lint config now enforces.
 *
 * The real marketing page is Phase 8. This exists so the root route is not
 * Next.js branding, and it is obviously placeholder rather than pretending to
 * be finished copy (AGENTS.md rule 1).
 */
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="measure-narrow flex flex-col items-start gap-6">
        <span className="rounded-4xl bg-primary-muted px-2.5 py-1 text-xs font-medium text-primary-text">
          Placeholder
        </span>

        <div className="flex flex-col gap-3">
          <h1 className="text-display-lg font-bold text-foreground">
            Margin School
          </h1>
          <p className="text-prose text-muted-foreground">
            Learn the financial markets, from the beginning. The marketing site
            is Phase 8 — this page exists so the root route is not boilerplate.
          </p>
        </div>

        <Button asChild>
          <Link href="/design-system">View the design system</Link>
        </Button>
      </div>
    </main>
  );
}
