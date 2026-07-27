import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import {
  ColourFoundations,
  MotionFoundations,
  ShapeFoundations,
  TypographyFoundations,
} from "./foundations";
import { PrimitivesShowcase } from "./primitives";
import {
  CatalogShowcase,
  CurriculumShowcase,
  LessonShowcase,
  LoadingShowcase,
  ProgressShowcase,
  StatesShowcase,
} from "./product";
import { ThemeToggle } from "@/components/margin/theme-toggle";

/**
 * The design system reference.
 *
 * An internal surface: it is the page you open to check that a change to the
 * tokens did what you expected, in both themes, before it reaches a real
 * route. Not linked from anywhere in the product and not indexed.
 *
 * It renders every component against the fixtures in
 * `lib/fixtures/content.ts`, which is also how we find out whether the
 * content model in docs/content-model.md actually holds up — Phase 6 does
 * this with real content, this does it with cheap content.
 */

export const metadata: Metadata = {
  title: "Design system — Margin School",
  robots: { index: false, follow: false },
};

const sections = [
  { id: "colour", label: "Colour" },
  { id: "typography", label: "Typography" },
  { id: "motion", label: "Motion" },
  { id: "shape", label: "Shape" },
  { id: "actions", label: "Actions" },
  { id: "forms", label: "Forms" },
  { id: "overlays", label: "Overlays" },
  { id: "feedback", label: "Feedback" },
  { id: "catalog", label: "Catalog" },
  { id: "progress", label: "Progress" },
  { id: "curriculum", label: "Curriculum" },
  { id: "lesson", label: "Lesson" },
  { id: "states", label: "States" },
  { id: "loading", label: "Loading" },
];

export default async function DesignSystemPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-page items-center gap-6 px-6 py-3.5">
          <div className="flex min-w-0 flex-col">
            <span className="font-heading text-base font-semibold text-foreground">
              Margin School
            </span>
            <span className="text-xs text-muted-foreground">Design system</span>
          </div>

          <nav className="hidden min-w-0 grow lg:block">
            <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-xs text-muted-foreground transition-colors duration-fast ease-quiet hover:text-foreground"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <ThemeToggle
            className="ml-auto shrink-0"
            labels={{
              light: "Light",
              dark: "Dark",
              system: "Follow the system",
              group: "Colour theme",
            }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-page px-6 py-14">
        <div className="measure-wide">
          <h1 className="text-brand-gradient font-heading text-display-lg font-bold">
            Design system
          </h1>
          <p className="mt-4 text-prose text-muted-foreground">
            Two layers of tokens and the components built on them. The colour
            ramps underneath are not registered as Tailwind utilities, so a
            component can only reach a semantic role — there is no way to write{" "}
            <code className="font-mono text-sm">bg-indigo-600</code>, and no
            reason to write a hex.
          </p>
          <p className="mt-3 text-prose text-muted-foreground">
            Everything below renders in both themes. Switch it top right and
            check the one you are about to ship.
          </p>
        </div>

        <div className="mt-16 flex flex-col gap-16">
          <ColourFoundations />
          <TypographyFoundations />
          <MotionFoundations />
          <ShapeFoundations />
          <PrimitivesShowcase />
          <CatalogShowcase />
          <ProgressShowcase />
          <CurriculumShowcase />
          <LessonShowcase />
          <StatesShowcase />
          <LoadingShowcase />
        </div>
      </main>
    </div>
  );
}
