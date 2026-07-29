import {
  BookOpenCheck,
  Compass,
  Languages,
  Layers,
  ShieldCheck,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CourseCard } from "@/components/margin/course-card";
import { CategoryGrid, CategoryTile } from "@/components/margin/marketing/category-grid";
import { CourseRail } from "@/components/margin/marketing/course-rail";
import { CtaBand } from "@/components/margin/marketing/cta-band";
import { FeatureCard, FeatureGrid } from "@/components/margin/marketing/feature-grid";
import { Hero } from "@/components/margin/marketing/hero";
import { RiskNote } from "@/components/margin/marketing/risk-note";
import {
  PageContainer,
  Section,
  SectionHeader,
} from "@/components/margin/marketing/section";
import { Stat, StatBand } from "@/components/margin/marketing/stat-band";
import { Step, StepList } from "@/components/margin/marketing/step-list";
import { ConceptChip } from "@/components/margin/meta";
import { Button } from "@/components/ui/button";
import { getPathname, Link } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { getCourseCardLabels, getCourseHref } from "@/lib/course-labels";
import {
  sampleCategories,
  sampleConcepts,
  sampleCourses,
} from "@/lib/fixtures/content";

/**
 * The home page.
 *
 * **Udemy's information architecture, none of its commerce psychology** — the
 * split docs/ux-architecture.md draws, applied module by module. Udemy's home
 * page, top to bottom, is: a rotating promotional hero with an offer deadline,
 * a topic carousel, "Trending courses", a logo wall captioned "trusted by over
 * 17,000 companies", a testimonial carousel with named faces, a
 * certifications block, "Career Accelerators" cards carrying star ratings and
 * rating counts, and a "Popular Skills" link farm with a learner count beside
 * every entry.
 *
 * What survives here and why:
 *
 * | Udemy | Here | Why |
 * | --- | --- | --- |
 * | Rotating offer hero | One static hero | The carousel exists to cycle deadlines. ADR-0001 removes the purchase, which removes the deadline |
 * | Trending courses rail | "Start here" rail | Same module, different ordering principle: pedagogical order, not popularity — and popularity would be a student count, which ADR-0002 forbids |
 * | "Trusted by 17,000 companies" | "What a subscription gets you" | Same slot, opposite rhetoric: facts about the product instead of proof from a crowd we do not have |
 * | Testimonial carousel | *(cut)* | ADR-0002. We would have to invent the people |
 * | Popular Skills link farm | "Browse by subject" | Kept: browsing by subject serves the reader who does not yet know what to search for. The learner counts are cut |
 * | — | "What you end up knowing" | No Udemy equivalent. Concepts are ADR-0004's skill graph made public, and the honest answer to "what will I get out of this" |
 *
 * **Tier 1**, per docs/ux-architecture.md: prerendered, no loading state, no
 * skeleton anywhere. That is what `setRequestLocale` buys and what keeps this
 * page's SEO — the acquisition channel — working. Nothing here reads cookies,
 * headers or `searchParams`, so nothing needs a `<Suspense>` boundary and the
 * whole page ships as static HTML.
 *
 * **No user data.** The course cards deliberately receive no `progress`, even
 * though `sampleProgress` exists and the catalog page passes it. Progress is
 * user-domain; reading it here would either make the page dynamic or, worse,
 * bake one person's progress into the prerendered HTML everyone receives
 * (AGENTS.md rule 3). A signed-in visitor's progress belongs on `/my-courses`
 * and `/learn`, which are Tier 2 for exactly this reason.
 *
 * Every figure in the stat band is **derived from the catalog**, never
 * authored. A hand-written "6 courses" is a claim that goes stale the moment
 * a seventh is published, and a stale count on a marketing page is
 * indistinguishable from a false one.
 */

/** Category slug → glyph. Icons are presentation, so they live here rather
 *  than in the content fixtures: an author should not be picking Lucide
 *  names, and a category with no entry simply renders without one. */
const categoryIcons: Record<string, LucideIcon> = {
  foundations: Compass,
  risk: ShieldCheck,
  practice: Target,
};

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  // Required per page, not just per layout. Without it this route falls back
  // to dynamic rendering even though the layout opted in.
  setRequestLocale(rawLocale);

  const locale = rawLocale as Locale;
  const t = await getTranslations();

  const totalLessons = sampleCourses.reduce((n, c) => n + c.lessonCount, 0);
  const totalHours = Math.round(
    sampleCourses.reduce((n, c) => n + c.estimatedMinutes, 0) / 60
  );

  // The rail is the reader's first decision, so it is ordered the way the
  // catalog is meant to be walked — foundations first — rather than by
  // whatever `sampleCourses` happens to hold. Four is enough to show a rail
  // scrolls without turning the section into the catalog.
  const startHere = [...sampleCourses]
    .sort((a, b) => a.categoryId.localeCompare(b.categoryId))
    .slice(0, 4);

  const railLabels = await Promise.all(
    startHere.map(async (course) => ({
      course,
      href: getCourseHref(course, locale),
      labels: await getCourseCardLabels({ course, locale }),
    }))
  );

  return (
    <main className="flex flex-1 flex-col">
      <Hero
        eyebrow={t("pages.home.hero.eyebrow")}
        title={t("pages.home.hero.title")}
        description={t("pages.home.hero.description")}
        note={t("risk.body")}
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/courses">{t("pages.home.hero.primary")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">{t("pages.home.hero.secondary")}</Link>
            </Button>
          </>
        }
      />

      <Section className="py-10 sm:py-12">
        <StatBand>
          <Stat
            value={sampleCourses.length}
            label={t("pages.home.stats.courses", { count: sampleCourses.length })}
          />
          <Stat
            value={totalLessons}
            label={t("pages.home.stats.lessons", { count: totalLessons })}
          />
          <Stat
            value={totalHours}
            label={t("pages.home.stats.hours", { count: totalHours })}
          />
          <Stat
            value={locales.length}
            label={t("pages.home.stats.languages", { count: locales.length })}
          />
        </StatBand>
      </Section>

      {/* `bleed`, so the rail reaches the viewport edge on a phone — a rail
          that stops short of the edge does not read as scrollable. The header
          keeps its own container. */}
      <Section bleed>
        <PageContainer>
          <SectionHeader
            title={t("pages.home.startHere.title")}
            description={t("pages.home.startHere.description")}
            action={
              <Button asChild variant="outline">
                <Link href="/courses">{t("pages.home.startHere.action")}</Link>
              </Button>
            }
          />
        </PageContainer>

        <CourseRail
          className="mt-8"
          label={t("pages.home.startHere.railLabel")}
        >
          {railLabels.map(({ course, href, labels }) => (
            <CourseCard
              key={course.id}
              course={course}
              href={href}
              labels={labels}
              className="h-full"
            />
          ))}
        </CourseRail>
      </Section>

      <Section tone="muted">
        <SectionHeader
          title={t("pages.home.included.title")}
          description={t("pages.home.included.description")}
        />
        <FeatureGrid className="mt-8">
          <FeatureCard
            icon={Layers}
            title={t("pages.home.included.everything.title")}
            description={t("pages.home.included.everything.description")}
          />
          <FeatureCard
            icon={Languages}
            title={t("pages.home.included.languages.title")}
            description={t("pages.home.included.languages.description")}
          />
          <FeatureCard
            icon={Sparkles}
            title={t("pages.home.included.beginner.title")}
            description={t("pages.home.included.beginner.description")}
          />
          <FeatureCard
            icon={BookOpenCheck}
            title={t("pages.home.included.practice.title")}
            description={t("pages.home.included.practice.description")}
          />
        </FeatureGrid>
      </Section>

      <Section>
        <SectionHeader
          title={t("pages.home.categories.title")}
          description={t("pages.home.categories.description")}
        />
        <CategoryGrid className="mt-8">
          {sampleCategories.map((category) => {
            const count = sampleCourses.filter(
              (course) => course.categoryId === category.id
            ).length;

            return (
              <CategoryTile
                key={category.id}
                // The category route (`/courses/[...category]`) is Phase 8.
                // Until it exists, the tile links to the catalog rather than
                // to a 404 — a dead link on the home page is worse than a
                // slightly broad destination.
                //
                // `getPathname`, not a template string: the French segment is
                // `/catalogue`, and a hand-built `/${locale}/courses` 404s for
                // the majority of early visitors.
                href={getPathname({ href: "/courses", locale })}
                name={category.name}
                description={category.description}
                count={t("pages.home.categories.count", { count })}
                icon={categoryIcons[category.slug]}
              />
            );
          })}
        </CategoryGrid>
      </Section>

      <Section tone="muted">
        <SectionHeader
          title={t("pages.home.concepts.title")}
          description={t("pages.home.concepts.description")}
          action={
            <Button asChild variant="outline">
              <Link href="/concepts">{t("pages.home.concepts.action")}</Link>
            </Button>
          }
        />
        {/*
         * Every chip renders unknown. `known` is `concept_mastery` — user
         * data — and this page is prerendered and served to everybody, so
         * reading it here would bake one visitor's mastery into the HTML the
         * next visitor receives. The "you know this" state belongs on
         * `/concepts` and `/review`, which are gated and uncached.
         */}
        <ul className="mt-8 flex flex-wrap gap-2">
          {sampleConcepts.map((concept) => (
            <li key={concept.id}>
              <ConceptChip>{concept.name}</ConceptChip>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeader title={t("pages.home.steps.title")} />
        <StepList className="mt-8">
          <Step
            index={1}
            title={t("pages.home.steps.one.title")}
            description={t("pages.home.steps.one.description")}
          />
          <Step
            index={2}
            title={t("pages.home.steps.two.title")}
            description={t("pages.home.steps.two.description")}
          />
          <Step
            index={3}
            last
            title={t("pages.home.steps.three.title")}
            description={t("pages.home.steps.three.description")}
          />
        </StepList>
      </Section>

      <Section tone="subtle">
        <CtaBand
          title={t("pages.home.cta.title")}
          description={t("pages.home.cta.description")}
          actions={
            <>
              <Button asChild size="lg">
                <Link href="/sign-up">{t("pages.home.cta.primary")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/courses">{t("pages.home.cta.secondary")}</Link>
              </Button>
            </>
          }
        />
        {/*
         * The disclaimer repeats under the closing CTA as well as under the
         * hero. That is deliberate on a financial-education product: the
         * footer is not where somebody reads it, and the two places a reader
         * decides to sign up are the top of the page and the bottom.
         */}
        <RiskNote className="mt-8" title={t("risk.title")}>
          {t("risk.body")}
        </RiskNote>
      </Section>
    </main>
  );
}
