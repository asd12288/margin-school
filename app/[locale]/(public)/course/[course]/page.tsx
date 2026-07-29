import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BookOpen, Clock, Languages, Layers, PenLine, Play } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CourseCard } from "@/components/margin/course-card";
import { CourseAside, CourseFact } from "@/components/margin/course/course-aside";
import { CourseHero } from "@/components/margin/course/course-hero";
import { Curriculum } from "@/components/margin/curriculum";
import { CourseRail } from "@/components/margin/marketing/course-rail";
import { BulletList, CheckList } from "@/components/margin/marketing/lists";
import { RiskNote } from "@/components/margin/marketing/risk-note";
import { SectionHeader } from "@/components/margin/marketing/section";
import {
  ConceptChip,
  FreePreviewBadge,
  MetaRow,
  MetaStat,
} from "@/components/margin/meta";
import { CurriculumSkeleton } from "@/components/margin/skeletons";
import { LockedHint, UnavailableInLocaleHint } from "@/components/margin/states";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
// `next/link`, NOT the wrapper from `@/i18n/navigation` — see the note on
// `hrefs` in `CourseContent` below. This is the one file in the repo where
// that import is wrong.
import Link from "next/link";
import { getPathname } from "@/i18n/navigation";
import { courseHours, getCourseCardLabels, getCourseHref } from "@/lib/course-labels";
import { sampleChapters, sampleConcepts, sampleCourses } from "@/lib/fixtures/content";
import type { Locale } from "@/lib/fixtures/content";
import type { Locale as RoutingLocale } from "@/i18n/routing";

/**
 * Course detail — the marketing page for a course, not the player.
 *
 * **Udemy's IA with the commerce cut out.** Udemy's course landing page runs,
 * top to bottom: category breadcrumb, preview video, title, subtitle,
 * "Bestseller" flag, star rating, rating count, enrolment count, "Created by
 * <instructor>", last-updated date, language list, a sticky purchase card
 * (price, struck-through price, "X hours left at this price", Add to cart, Buy
 * now, 30-day money-back guarantee, share/gift/coupon), "What you'll learn",
 * related topics, "Course content", "Requirements", "Description", "Who this
 * course is for", an instructor panel with a bio and photo, a student-feedback
 * rating histogram, individual reviews, and a "More courses by…" carousel.
 *
 * Six of those modules cannot exist here, and both reasons are hard rules
 * rather than taste:
 *
 * - **The purchase card, price anchoring and the deadline** — ADR-0001. Access
 *   is one all-access subscription; there is no cart, no per-course price, no
 *   coupon and no timer anywhere in this product. What is left of that card is
 *   `CourseAside`: the cover, what is inside, and one call to action.
 * - **Instructor panel, star rating, rating count, enrolment count, reviews** —
 *   ADR-0002. We are the sole publisher and do not invent people or social
 *   proof. There is nothing to put in their place, so the sections are gone
 *   rather than emptied.
 *
 * What replaces them is the argument this product actually has: depth, and
 * *state*. `hasFreePreview`, `accessState` and `availableLocales` are shown in
 * the hero, which is information Udemy's banner does not carry at all — a
 * reader can see before scrolling whether they can start now, whether it is
 * behind the subscription, and whether it exists in their language.
 *
 * ---
 *
 * **The rendering shape below is load-bearing and was not chosen for
 * readability.** It is the one the framework's own instant-navigation guide
 * prescribes for `/store/[slug]`
 * (`node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`):
 * a synchronous page body, `params.then(…)` inside `<Suspense>`, and a
 * `use cache` component that receives plain values. Two different constraints
 * land on it, and they fail differently.
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
 * **2. Instant-navigation validation.** `unstable_instant` is stricter than
 * the above, and this page is written to satisfy it — the export is below.
 * See the "Instant navigation" subsection of docs/ux-architecture.md for the
 * whole picture; the two constraints that shape *this file* are:
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
 * That export is present now. It was absent while `(public)/layout.tsx` still
 * did `await params` for `setRequestLocale`, which blocked the shell for every
 * route under it; the shell reads the locale through `next/root-params`
 * instead, so the blocker is gone and this page validates.
 *
 * The `samples` below name **both** params, because an inner segment's samples
 * replace an outer segment's rather than merging with them
 * (`resolveInstantConfigSamplesForPage` in `instant-config.js`). Inheriting the
 * layout's locale-only samples is what the build rejects, in as many words:
 * `Route "/[locale]/course/[course]" accessed param "course" which is not
 * defined in the samples of unstable_instant`. The slug is a real one from
 * `sampleCourses` — the validator renders the sample for real, so a made-up
 * slug would `notFound()` and validate the not-found path instead of the page.
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
 * The same rule is why `CourseAside` shows no "resume where you left off" and
 * the related rail passes no `progress` to its cards, even though
 * `sampleProgress` exists two imports away. Both would be user data inside a
 * cached function, and both belong on the Tier 2 routes instead.
 *
 * `Curriculum` is a client component, so its per-entity labels are records
 * keyed by id rather than formatter functions: functions cannot cross the
 * server/client boundary. Plurals and durations are formatted here, on the
 * server, and what crosses is already words. See design-system.md:183.
 */
// The slug is written out, not `sampleCourses[0].slug`. Segment configs are
// read by static analysis at build time, not evaluated — an expression it
// cannot fold is rejected wholesale with "Invalid segment configuration export
// detected", the same class of failure as the `as const` form. It must stay a
// literal, so it must stay in step with lib/fixtures/content.ts by hand; the
// build fails loudly (`notFound()` during validation) if this slug stops
// existing, which is the check that keeps it honest.
export const unstable_instant = {
  prefetch: "static",
  samples: [
    { params: { locale: "fr", course: "reading-a-price-chart" } },
    { params: { locale: "en", course: "reading-a-price-chart" } },
  ],
};

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

  const typedLocale = locale as Locale;
  const routingLocale = locale as RoutingLocale;
  const available = course.availableLocales.includes(typedLocale);
  const locked = course.accessState !== null;
  const hours = courseHours(course);

  /**
   * **Every link on this page resolves its href here, and renders with
   * `next/link` rather than the wrapper from `@/i18n/navigation`.**
   *
   * That wrapper is normally mandatory — i18n/routing.ts says so, and a bare
   * `next/link` elsewhere drops a French reader onto the default locale. It
   * cannot be used *here*, and the failure is not subtle: the wrapper resolves
   * the active locale through next-intl's `getServerLocale()`, which falls
   * through to `headers()` when no request-scoped locale is set — and this
   * component is a `use cache` scope, where `setRequestLocale` is invisible
   * (see the note on `getTranslations({ locale })` above). The result is a
   * hard render error, "used `headers()` inside \"use cache\"", on every
   * course page. Found by rendering the page, not by the type checker.
   *
   * `getPathname` is the escape hatch the wrapper is built on and takes the
   * locale as an argument, so it reads nothing from the request. Resolving
   * the three static destinations once, up front, keeps the rule visible in
   * one place instead of at five call sites.
   */
  const hrefs = {
    courses: getPathname({ href: "/courses", locale: routingLocale }),
    signUp: getPathname({ href: "/sign-up", locale: routingLocale }),
    pricing: getPathname({ href: "/pricing", locale: routingLocale }),
  };

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

  const concepts = course.conceptIds
    .map((id) => sampleConcepts.find((concept) => concept.id === id))
    .filter((concept) => concept !== undefined);

  // Three others from the catalog. Ordered by how close they sit to this one —
  // same category first — rather than by popularity, which would be a student
  // count and is forbidden (ADR-0002).
  const related = sampleCourses
    .filter((other) => other.id !== course.id)
    .sort((a, b) => {
      const near = (c: typeof course) => (c.categoryId === course.categoryId ? 0 : 1);
      return near(a) - near(b);
    })
    .slice(0, 3);

  const relatedCards = await Promise.all(
    related.map(async (other) => ({
      course: other,
      href: getCourseHref(other, locale as RoutingLocale),
      // No `progress`: user data must never be read inside a cached function.
      labels: await getCourseCardLabels({
        course: other,
        locale: locale as RoutingLocale,
      }),
    }))
  );

  return (
    <>
      <CourseHero
        eyebrow={course.categoryName}
        title={course.title}
        summary={course.summary}
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={hrefs.courses}>{t("shell.nav.courses")}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{course.categoryName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        badges={
          <>
            {course.hasFreePreview ? (
              <FreePreviewBadge>
                <Play className="mr-1.5 size-2.5 fill-current" />
                {t("course.freePreview")}
              </FreePreviewBadge>
            ) : null}
            {locked ? (
              <LockedHint
                label={
                  course.accessState === "requires-prerequisite"
                    ? t("course.laterInPath")
                    : t("course.included")
                }
              />
            ) : null}
            {available ? null : (
              <UnavailableInLocaleHint label={t("course.notInThisLanguage")} />
            )}
          </>
        }
        meta={
          <MetaRow>
            <MetaStat icon={Clock}>
              <span data-numeric>{t("course.duration", { hours })}</span>
            </MetaStat>
            <MetaStat icon={BookOpen}>
              <span data-numeric>
                {t("course.lessons", { count: course.lessonCount })}
              </span>
            </MetaStat>
            <MetaStat icon={Layers}>
              <span data-numeric>
                {t("course.chapters", { count: course.chapterCount })}
              </span>
            </MetaStat>
          </MetaRow>
        }
      />

      {/*
        Main column plus aside. The aside comes *second* in the DOM and is
        pulled to the right by `lg:order-last` on a wide screen, so a reader
        on a phone — and anyone tabbing or using a screen reader — reaches the
        course itself before the panel about it. Source order is reading
        order; the grid only decides where things sit.
      */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-12">
          <section>
            <SectionHeader
              headingLevel="h2"
              title={t("courseDetail.outcomes.title")}
            />
            <CheckList className="mt-6" items={course.outcomes} />
          </section>

          {concepts.length ? (
            <section>
              <SectionHeader
                headingLevel="h2"
                title={t("courseDetail.concepts.title")}
                description={t("courseDetail.concepts.description")}
              />
              {/* Every chip unknown: `known` is `concept_mastery`, which is
                  user data and cannot be read in here. */}
              <ul className="mt-6 flex flex-wrap gap-2">
                {concepts.map((concept) => (
                  <li key={concept.id}>
                    <ConceptChip>{concept.name}</ConceptChip>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <SectionHeader
              headingLevel="h2"
              title={t("courseDetail.curriculum.title")}
              description={t("courseDetail.curriculum.summary", {
                chapters: course.chapterCount,
                lessons: course.lessonCount,
                hours,
              })}
            />
            <Curriculum
              className="mt-6"
              chapters={chapters}
              locale={typedLocale}
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
          </section>

          <section>
            <SectionHeader
              headingLevel="h2"
              title={t("courseDetail.requirements.title")}
            />
            <BulletList className="mt-6" items={course.requirements} />
          </section>

          <section>
            <SectionHeader
              headingLevel="h2"
              title={t("courseDetail.description.title")}
            />
            <div className="measure-prose mt-6 flex flex-col gap-4">
              {course.description.map((paragraph, i) => (
                <p key={i} className="text-prose text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader
              headingLevel="h2"
              title={t("courseDetail.audience.title")}
            />
            <BulletList className="mt-6" items={course.audience} />
          </section>

          <RiskNote title={t("risk.title")}>{t("risk.body")}</RiskNote>
        </div>

        <div className="lg:order-last">
          <CourseAside
            courseId={course.id}
            coverImageUrl={course.coverImageUrl}
            coverAlt={t("course.coverAlt", { title: course.title })}
            includesTitle={t("courseDetail.aside.includes")}
            facts={
              <>
                <CourseFact icon={BookOpen}>
                  {t("course.lessons", { count: course.lessonCount })}
                </CourseFact>
                <CourseFact icon={Layers}>
                  {t("course.chapters", { count: course.chapterCount })}
                </CourseFact>
                <CourseFact icon={Clock}>
                  {t("courseDetail.aside.reading", { hours })}
                </CourseFact>
                <CourseFact icon={Languages}>
                  {course.availableLocales.length > 1
                    ? t("courseDetail.aside.bothLanguages")
                    : t("courseDetail.aside.oneLanguage")}
                </CourseFact>
                <CourseFact icon={PenLine}>
                  {t("courseDetail.aside.practice")}
                </CourseFact>
                {course.hasFreePreview ? (
                  <CourseFact icon={Play}>
                    {t("courseDetail.aside.preview")}
                  </CourseFact>
                ) : null}
              </>
            }
            action={
              <Button asChild size="lg" className="w-full">
                <Link href={hrefs.signUp}>{t("courseDetail.aside.action")}</Link>
              </Button>
            }
            secondaryAction={
              <Button asChild variant="outline" className="w-full">
                <Link href={hrefs.pricing}>
                  {t("courseDetail.aside.secondaryAction")}
                </Link>
              </Button>
            }
            note={t("courseDetail.aside.note")}
          />
        </div>
      </div>

      <section className="mt-16">
        <SectionHeader
          headingLevel="h2"
          title={t("courseDetail.related.title")}
          description={t("courseDetail.related.description")}
          action={
            <Button asChild variant="outline">
              <Link href={hrefs.courses}>{t("courseDetail.related.action")}</Link>
            </Button>
          }
        />
        <CourseRail className="mt-8" label={t("courseDetail.related.railLabel")}>
          {relatedCards.map(({ course: other, href, labels }) => (
            <CourseCard
              key={other.id}
              course={other}
              href={href}
              labels={labels}
              className="h-full"
            />
          ))}
        </CourseRail>
      </section>
    </>
  );
}

/**
 * Layout-identical to the real content, per skeleton rule 1 — the hero band,
 * the two-column split and the aside panel all hold their dimensions, so
 * nothing shifts when the content arrives.
 *
 * On the six slugs in `generateStaticParams` this never paints: they resolve
 * at build time and ship as static HTML. It exists for the unlisted-slug path
 * described in the file comment.
 */
function CoursePageFallback() {
  return (
    <>
      <div className="rounded-xl border border-border bg-subtle/60 px-6 py-8 sm:px-8 sm:py-10">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-9 w-2/3" />
        <Skeleton className="mt-3 h-5 w-full max-w-xl" />
        <Skeleton className="mt-4 h-4 w-52" />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-8">
          <Skeleton className="h-7 w-56" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          <CurriculumSkeleton className="mt-4" />
        </div>
        <div className="lg:order-last">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="mt-4 h-40 w-full rounded-xl" />
        </div>
      </div>
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
