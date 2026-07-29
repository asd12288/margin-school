import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

/**
 * The four legal documents a French commercial site needs: terms, a privacy
 * policy, mentions légales, and an accessibility statement. Nothing else
 * lives at this route — `generateStaticParams` is the exhaustive list, and
 * `notFound()` below is what keeps it exhaustive rather than aspirational.
 */
const LEGAL_DOCS = ["terms", "privacy", "mentions", "accessibility"] as const;
type LegalDoc = (typeof LEGAL_DOCS)[number];

function isLegalDoc(value: string): value is LegalDoc {
  return (LEGAL_DOCS as readonly string[]).includes(value);
}

/**
 * Every valid doc, prerendered — these are Tier 1 public pages per
 * docs/ux-architecture.md, and there is no reason for a legal document to
 * ever be a loading skeleton.
 */
/**
 * Instant-navigation validation. `doc` has to be named here even though it is
 * read inside `<Suspense>`: an inner segment's `samples` replace the outer
 * segment's rather than merging, and a `<Suspense>` boundary does not exempt a
 * param from being declared. A real doc, because the validator renders the
 * sample for real — an unlisted one would `notFound()` and validate the
 * not-found path instead of this page. Written out rather than
 * `LEGAL_DOCS[0]`, because segment configs are statically analysed, not
 * evaluated.
 */
export const unstable_instant = {
  prefetch: "static",
  samples: [
    { params: { locale: "fr", doc: "terms" } },
    { params: { locale: "en", doc: "terms" } },
  ],
};

export function generateStaticParams() {
  return LEGAL_DOCS.map((doc) => ({ doc }));
}

/**
 * Placeholder content, deliberately. AGENTS.md rule 1 requires placeholder
 * content to read as obviously placeholder — an authoritative-looking privacy
 * policy that is not the real one is a liability, not a stand-in. Every
 * document here says the same two things, plainly, in the reader's own
 * language: it is being prepared, and Margin School is educational and never
 * gives investment advice.
 *
 * `use cache`: this is a pure function of `(doc, locale)`, same reasoning as
 * `CourseContent` in `(public)/course/[course]/page.tsx`.
 */
async function LegalDocContent({
  doc,
  locale,
}: {
  doc: string;
  locale: string;
}) {
  "use cache";

  if (!isLegalDoc(doc)) notFound();

  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <>
      <p className="inline-flex w-fit items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        {t("placeholder")}
      </p>
      <h1 className="mt-4 text-display font-bold tracking-tight text-foreground">
        {t(`${doc}.title`)}
      </h1>
      <p className="measure-prose mt-3 text-prose text-muted-foreground">
        {t("notice")}
      </p>
    </>
  );
}

/**
 * No cookies, headers or searchParams are read anywhere on this route — the
 * only runtime-only value is `doc` itself, for the four values outside
 * `generateStaticParams`'s list. Reading it to decide `notFound()` still has
 * to happen inside `<Suspense>` under `cacheComponents: true`, same
 * reasoning and same framework quirk as `(public)/course/[course]/page.tsx`:
 * a flat, unwrapped `notFound()` for an unlisted param throws
 * `DYNAMIC_SERVER_USAGE` at request time instead of 404ing (verified against
 * this Next.js version with `next build && next start` against
 * `/en/legal/not-a-real-doc`, which 500'd before this file was split).
 */
export default function LegalDocPage({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
      <Suspense fallback={null}>
        {params.then(({ locale, doc }) => (
          <LegalDocContent doc={doc} locale={locale} />
        ))}
      </Suspense>
    </main>
  );
}
