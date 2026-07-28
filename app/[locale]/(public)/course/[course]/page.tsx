import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Curriculum } from "@/components/margin/curriculum";
import { CurriculumSkeleton } from "@/components/margin/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { sampleChapters, sampleCourses } from "@/lib/fixtures/content";
import type { Locale } from "@/lib/fixtures/content";

/**
 * Course detail, from fixtures. Phase 8 replaces the data source and adds
 * metadata, hreflang and structured data.
 *
 * `generateStaticParams` is what keeps this Tier 1 for every slug it lists —
 * prerendered, no loading state. It only lists the fixture slugs, though, and
 * under this project's `cacheComponents: true` (see `next.config.ts`), a
 * slug outside that list is genuinely runtime data: `params` cannot be
 * resolved for it until request time, and reading `course` from it — to
 * decide whether to call `notFound()` — has to happen inside a `<Suspense>`
 * boundary, the same as any other runtime-only value under Cache Components
 * (see the "With Cache Components" section of the framework's own
 * `dynamic-routes` and `generate-static-params` docs). That's why
 * `CourseContent` exists as a separate, Suspense-wrapped component instead of
 * this page doing the fixture lookup and `notFound()` call directly: a fully
 * flat version of this page (no split, `notFound()` called right after
 * `sampleCourses.find`) builds cleanly but throws `DYNAMIC_SERVER_USAGE` at
 * request time for exactly the slugs that need `notFound()` — confirmed
 * against this exact Next.js version by hitting an unlisted slug after
 * `next build && next start` and getting an uncaught request-time 500.
 *
 * `setRequestLocale`, unlike the `course` lookup, does *not* need to be
 * inside that boundary — it was moved into this page's own body instead of
 * `CourseContent`'s, matching every other Suspense-split page in this repo
 * (`(app)/account`, `(app)/learn`, `(app)/my-courses`, `(admin)/admin`). This
 * was tested, not assumed: `locale` (unlike `course`) is exhaustively
 * enumerated by `app/[locale]/layout.tsx`'s own `generateStaticParams` (`fr`,
 * `en`, nothing else), so awaiting `params` here just to read `locale` does
 * not force resolution of the still-unresolved `course` segment. Verified by
 * moving `setRequestLocale` here, then running `npm run build` (succeeds,
 * same route list, same pre-existing unrelated `DYNAMIC_SERVER_USAGE` lines
 * from `[...rest]`) and `next build && next start` against
 * `/en/course/not-a-real-course` (still `200` with the not-found body and
 * `noindex`, not a crash — see the `notFound()` call site below for that
 * behaviour). No divergence from the common pattern was actually necessary.
 *
 * `Curriculum` is a client component, so its per-entity labels are records
 * keyed by id rather than formatter functions: functions cannot cross the
 * server/client boundary. Plurals and durations are formatted here, on the
 * server, and what crosses is already words. See design-system.md:183.
 */
export function generateStaticParams() {
  return sampleCourses.map((course) => ({ course: course.slug }));
}

async function CourseContent({
  params,
}: {
  params: Promise<{ locale: string; course: string }>;
}) {
  const { locale, course: slug } = await params;

  const course = sampleCourses.find((c) => c.slug === slug);
  // KNOWN GAP, not fixed here — tracked for Phase 8:
  //
  // For a genuinely unknown slug (one of the six known slugs never reaches
  // this branch — they resolve fully at build time via `generateStaticParams`
  // and ship without a fallback ever painting), this `notFound()` currently
  // produces a *soft* 404: the designed not-found body renders, but the HTTP
  // status is `200`, not `404`.
  //
  // Why: this component only runs inside the `<Suspense>` boundary in
  // `CoursePage` below (required — see the file-level comment on
  // `generateStaticParams`). Per the framework's own streaming guide
  // (`node_modules/next/dist/docs/01-app/02-guides/streaming.md`, "Status
  // codes"), once a Suspense fallback has streamed to the client the `200`
  // response is already committed; a `notFound()` that resolves afterward can
  // only inject `<meta name="robots" content="noindex">`, not change the
  // status code. There is no route-segment escape hatch here either:
  // `dynamicParams` — the config that would otherwise let an unlisted param
  // 404 outright — "is not available when Cache Components is enabled"
  // (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/dynamicParams.md`),
  // and it was removed entirely in v16 under Cache Components per
  // `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md`.
  //
  // This is left as-is deliberately: these pages are fixture-backed
  // placeholders, there is no sitemap and nothing is indexable yet, and the
  // only workaround available today (deciding 404-ness in the proxy/
  // middleware, ahead of this component) would require the proxy to know
  // which course slugs are real — content knowledge that belongs in this
  // page, not in routing infrastructure. The real fix belongs with the work
  // that replaces fixtures with real content and metadata (Phase 8).
  //
  // A public, indexable content route returning `200` for a nonexistent page
  // is a soft 404 and actively hostile to SEO — this repo's primary
  // acquisition channel. This route MUST return a genuine `404` status before
  // it is exposed to search (see docs/ux-architecture.md, "Tier 1").
  if (!course) notFound();

  const t = await getTranslations();

  // The fixtures carry one course's curriculum, with no courseId on Chapter —
  // every course shows the same chapters until Phase 8 supplies real queries.
  const chapters = sampleChapters;

  const chapterProgress: Record<string, string> = {};
  const chapterCount: Record<string, string> = {};
  const lessonDuration: Record<string, string> = {};

  for (const chapter of chapters) {
    const completed = chapter.lessons.filter((lesson) => lesson.completed).length;
    const total = chapter.lessons.length;

    chapterProgress[chapter.id] = t("curriculum.chapterProgress", { completed, total });
    chapterCount[chapter.id] = t("curriculum.chapterCount", { completed, total });

    for (const lesson of chapter.lessons) {
      lessonDuration[lesson.id] = t("curriculum.lessonDuration", {
        minutes: lesson.estimatedMinutes,
      });
    }
  }

  return (
    <>
      <h1 className="text-display font-bold tracking-tight text-foreground">
        {course.title}
      </h1>
      <p className="measure-prose mt-3 text-prose text-muted-foreground">
        {course.summary}
      </p>

      <Curriculum
        className="mt-10"
        chapters={chapters}
        locale={locale as Locale}
        labels={{
          chapterProgress,
          chapterCount,
          lessonDuration,
          completed: t("curriculum.completed"),
          freePreview: t("curriculum.free"),
          locked: t("curriculum.locked"),
          unavailableInLocale: t("curriculum.notInThisLanguage"),
        }}
      />
    </>
  );
}

function CoursePageFallback() {
  return (
    <>
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="mt-3 h-5 w-full max-w-xl" />
      <CurriculumSkeleton className="mt-10" />
    </>
  );
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ locale: string; course: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
      <Suspense fallback={<CoursePageFallback />}>
        <CourseContent params={params} />
      </Suspense>
    </main>
  );
}
