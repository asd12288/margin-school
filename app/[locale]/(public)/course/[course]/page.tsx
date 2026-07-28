import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Curriculum } from "@/components/margin/curriculum";
import { CurriculumSkeleton } from "@/components/margin/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { sampleChapters, sampleCourses } from "@/lib/fixtures/content";
import type { Locale } from "@/lib/fixtures/content";

/**
 * Course detail, from fixtures. Phase 8 replaces the data source and adds
 * metadata, hreflang and structured data.
 *
 * The shape — `params.then(…)` inside `<Suspense>`, feeding a `use cache`
 * component that receives a plain slug string — is the one the framework's own
 * instant-navigation guide prescribes for `/store/[slug]`
 * (`node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`). Two
 * different constraints land on it, and they fail differently.
 *
 * **1. Cache Components.** `generateStaticParams` is what keeps this Tier 1
 * for every slug it lists — prerendered, no loading state. It only lists the
 * fixture slugs, and under this project's `cacheComponents: true` (see
 * `next.config.ts`) a slug outside that list is genuinely runtime data:
 * `params` cannot be resolved for it until request time, so reading `course` —
 * to decide whether to call `notFound()` — has to happen inside a `<Suspense>`
 * boundary, like any other runtime-only value under Cache Components (see the
 * "With Cache Components" section of the framework's `dynamic-routes` and
 * `generate-static-params` docs). A fully flat version of this page (no split,
 * `notFound()` right after `sampleCourses.find`) builds cleanly but throws
 * `DYNAMIC_SERVER_USAGE` at request time for exactly the slugs that need
 * `notFound()` — confirmed against this Next.js version by hitting an unlisted
 * slug after `next build && next start` and getting an uncaught 500.
 *
 * **2. Instant-navigation validation.** `unstable_instant` (Task 13) is
 * stricter than the above, and this page is written to satisfy it even though
 * the export cannot be switched on yet:
 *
 * - **Nothing awaits `params` in a component body.** During validation every
 *   server `params` access is deferred to the Runtime stage
 *   (`createServerParamsInInstantValidation` in
 *   `node_modules/next/dist/server/request/params.js` resolves through
 *   `sharedParamsParent`, which is `delayUntilStage(RenderStage.Runtime)`), so
 *   an `await params` anywhere outside a boundary blocks the static shell —
 *   including one that only wants `locale`. Hence the page body is synchronous
 *   and both values are read inside the `.then` below. Measured: with
 *   `const { locale } = await params` restored at the top, validation fails
 *   with "Runtime data … was accessed outside of `<Suspense>`" for this route.
 * - **A `<Suspense>` boundary does not exempt a param from `samples`.** The
 *   exhaustive-params proxy
 *   (`node_modules/next/dist/server/app-render/instant-validation/instant-samples.js`)
 *   throws for any param of the route that no sample declares, wherever it is
 *   read. So enabling the export requires this page to carry its own
 *   `unstable_instant` with `samples` naming both `locale` and `course` —
 *   inner segments *replace* an outer segment's samples with no merging
 *   (`resolveInstantConfigSamplesForPage` in `instant-config.js`), which is
 *   what keeps course slugs out of the shared shell layout's config.
 *
 * That export is deliberately absent for now: a config here turns validation
 * on for this route, and validation then re-renders `(public)/layout.tsx`,
 * whose own `await params` (which `setRequestLocale` needs, and next-intl
 * needs that to stay static) blocks. See `.superpowers/sdd/task-13-report.md`
 * for the shell-level blocker — this page is no longer part of it.
 *
 * **No `setRequestLocale` here.** Every other Suspense-split page in this repo
 * calls it; this one cannot, because calling it means awaiting `params` in the
 * page body, which is exactly what constraint 2 forbids. It is not needed:
 * `app/[locale]/layout.tsx` already calls it for a document render, and the
 * only translated strings on this page are produced inside `CourseContent`,
 * which is handed its locale explicitly and never consults the ambient one.
 * Verified after `next build && next start` — `/fr/cours/…` renders French
 * labels and `/en/course/…` English ones.
 *
 * **Why `use cache`.** Everything `CourseContent` renders is a pure function
 * of `(slug, locale)` — a fixture lookup and translated labels, no user data —
 * so caching it is free correctness-wise and puts the cache boundary where
 * Phase 8's real content query will need it. Two things Phase 8 inherits: the
 * default cache profile, which shows up in the build output as `15m`
 * revalidate / `1y` expire and which real content should replace with
 * `cacheTag`/`cacheLife`; and `completed` on a lesson, which is user data
 * (AGENTS.md rule 3) and a fixture constant only for now — when it becomes
 * real it must not join the content inside this cached function, it moves
 * behind its own `<Suspense>`. That is the "stream anything genuinely dynamic"
 * half of the guide's pattern; this page has nothing genuinely dynamic today,
 * which is why there is one boundary here and not two.
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
  course: slug,
  locale,
}: {
  course: string;
  locale: string;
}) {
  "use cache";

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
  // `CoursePage` below (required — see the file-level comment). Per the
  // framework's own streaming guide
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
  //
  // Moving this call inside a `use cache` scope changed none of that:
  // re-verified with `next build && next start` against
  // `/en/course/not-a-real-course`, which still answers `200` with the
  // designed not-found body and `<meta name="robots" content="noindex">`. The
  // thrown `NEXT_HTTP_ERROR_FALLBACK;404` is a well-known digest, so it
  // propagates out of the cache rather than being cached or swallowed.
  if (!course) notFound();

  // Passed explicitly, not inherited: `setRequestLocale` stores the locale in
  // a request-scoped React cache that a `use cache` scope cannot read, and
  // next-intl's fallback for a missing one is `headers()` — the single thing
  // that would make this function uncacheable.
  const t = await getTranslations({ locale });

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

export default function CoursePage({
  params,
}: {
  params: Promise<{ locale: string; course: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
      <Suspense fallback={<CoursePageFallback />}>
        {params.then(({ locale, course }) => (
          <CourseContent course={course} locale={locale} />
        ))}
      </Suspense>
    </main>
  );
}
