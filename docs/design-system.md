# Design system

Implements Phase 2 of [roadmap.md](roadmap.md). Reference page: **`/design-system`** — internal, `noindex`, not linked from the product. Open it in both themes before shipping anything that touches a token.

## The one rule

**Components use semantic roles. Never primitives, never raw values.**

Tokens live in [app/globals.css](../app/globals.css) in two layers:

| Layer | Example | Registered in `@theme`? | Reachable from a class? |
| --- | --- | --- | --- |
| **Primitives** — raw ramps | `--indigo-600`, `--neutral-200` | No | **No** |
| **Semantic roles** — meaning | `--primary`, `--locked`, `--gain` | Yes | Yes |

Keeping the ramps out of `@theme` is the enforcement mechanism, not a style preference: Tailwind never generates `bg-indigo-600`, so a component *cannot* reach past the role layer even by accident. If you need a colour that has no role, **add a role** — do not reach for a hex.

The ramps are `neutral` · `indigo` (brand) · `cyan` (accent) · `emerald` (success, gain) · `rose` (loss) · `amber` (warning, risk) · `red` (destructive).

### Roles beyond shadcn's vocabulary

shadcn ships `primary / muted / accent / destructive`. This product needs more, and these are the additions:

- `subtle`, `border-strong`, `highlight` — surfaces and lines
- `warning`, `success`, `info` (+ `-muted` for each) — shadcn only has `destructive`
- `gain`, `loss`, `flat` — market direction
- `chart-surface`, `chart-grid`, `chart-axis`, `chart-annotation`, `chart-1…5`
- `locked`, `locked-foreground`, `locked-border` — a subscription product shows this constantly
- `progress-track`, `progress-indicator`, `progress-complete`
- `free-preview`, `free-preview-foreground`

## Typography

**Inter** for everything, **JetBrains Mono** for figures. Headings separate themselves by weight and negative tracking rather than by a second typeface. Both self-hosted at build time by `next/font`, so no request reaches Google from a user's browser — that is what keeps them compatible with the EU-processor rule.

Two scales, because interface text and lesson body text have different jobs:

- **UI** — Tailwind's default `text-xs … text-base`
- **Reading** — `text-prose-sm`, `text-prose`, `text-prose-lg`
- **Display** — `text-display-sm`, `text-display`, `text-display-lg`, `text-display-xl`, each with tracking that tightens as it grows

`latin-ext` is included in both subsets. Without it French accented glyphs fall back to a system face mid-sentence.

### Measure

`measure-narrow` (46ch) · `measure-prose` (70ch) · `measure-wide` (90ch).

**In `ch`, never `px`.** French runs 15–20% longer than English; a measure in characters holds its reading comfort across both, a measure in pixels does not.

### Figures

`data-numeric` or the `numeric` utility gives tabular figures. Use it on every price, percentage, count and duration, so columns align and ticking values do not jitter.

## Motion

Durations and easings are tokens exactly like colour. `--duration-*` is not a Tailwind theme namespace, so named `duration-fast` / `duration-base` / … are declared as real `@utility` rules — that keeps the tokens reachable without arbitrary values.

| Token | Value | Use |
| --- | --- | --- |
| `duration-instant` | 80ms | State flips with no travel |
| `duration-fast` | 140ms | Hover, focus, colour |
| `duration-base` | 200ms | Enter and exit, most things |
| `duration-slow` | 320ms | Progress fills, card flip |
| `duration-deliberate` | 480ms | Rare, never routine |

Easings: `ease-quiet` (decelerating, the default), `ease-quiet-in-out`, `ease-settle` (slight overshoot, sparing).

**`prefers-reduced-motion` is honoured once, globally**, in `globals.css` — a `*` rule with `!important` on `animation-duration` and `transition-duration`, which outranks every utility below. Component authors do not have to remember it. Where a component's meaning depends on movement — the flashcard flip — it also carries an explicit `motion-reduce:` fallback.

### Recipes from transitions.dev

The expressive animations are adapted from [transitions.dev](https://transitions.dev/) (Jakub Antalik). It is a copy-paste catalogue, not a package: **no runtime dependency, no client JS, nothing added to a bundle.**

Those recipes ship their own variable scale (`--check-rotate-dur`, `--shake-dur-a`, …). Pasting it in would leave the project with two competing motion vocabularies, so each recipe is **rewritten against our tokens** — the characteristics are kept, the numbers are ours. The two scales already agreed where it mattered: their default ease is `cubic-bezier(0.22, 1, 0.36, 1)`, which is exactly `--ease-quiet`.

| Utility | Adapted from | Used by |
| --- | --- | --- |
| `animate-success-check` | Success check | Quiz correct answer — fade, rotate, blur, settle-bob, plus the tick drawing itself |
| `animate-error-shake` | Error state shake | Quiz wrong answer — deliberately small; a violent shake reads as punishment |
| `animate-panel-reveal` | Panel reveal | Empty, error, locked and unavailable states |

The skill is installed at [.agents/skills/transitions-dev](../.agents/skills/transitions-dev/) (plus `transitions-polish`), giving the `transitions reveal` / `review` / `apply` / `refine` commands and all 27 reference recipes offline.

> **Never import the skill's `_root.css`.** Its motion scale collides with ours on two names, and the collision is silent:
>
> | Token | Skill | Ours |
> | --- | --- | --- |
> | `--duration-fast` | 250ms | **140ms** |
> | `--duration-slow` | 400ms | **320ms** |
>
> Pasting that block would redefine both and slow every hover, focus and colour transition in the product from 140ms to 250ms. Adapt recipes onto our tokens instead — which is what the three above do. Use the skill's `## Motion tokens` table as a *usage* reference (it maps intent to duration), not as something to import.

**When adding a recipe, measure `stroke-dasharray` rather than guessing it.** The skill calls this out and it has already bitten once here: Lucide's check path is 22.63 user units, not the 26 originally hardcoded, which finished the draw early and left the tail of the animation idle.

## Themes

Light and dark are both first-class. `next-themes` with the `class` strategy (`.dark` on `<html>`), three-way: light / dark / system.

Dark is not an inversion. The ground is a deep cool neutral rather than black, the foreground stops short of pure white so long reading stays comfortable, brand hues step lighter because saturation reads weaker on dark ground, and `--highlight` drops from 22% to 12% because a white inset line reads much hotter on a dark surface.

## Components

`components/ui/` is vendored shadcn — 60 components, Radix base. Three files are modified from upstream and will be overwritten by `shadcn add`:

| File | Change |
| --- | --- |
| `ui/button.tsx` | Taller sizes, lit primary, trailing-icon nudge, `cursor-pointer` |
| `ui/carousel.tsx` | Targeted `eslint-disable` on a deliberate initial state sync |
| `hooks/use-mobile.ts` | Rewritten to `useSyncExternalStore`; upstream fails `react-hooks/set-state-in-effect` |

`components/margin/` is ours:

| Component | Notes |
| --- | --- |
| `course-card` · `course-cover` | Udemy's IA, none of its commerce. See below. |
| `curriculum` | Chapter accordion, per-chapter progress, per-lesson state |
| `lesson/blocks` | All ten v1 block types from [content-model.md](content-model.md) |
| `lesson/candlestick-chart` | Server-rendered SVG. No charting library, no client JS |
| `lesson/quiz` · `lesson/flashcards` | Client, optimistic |
| `progress` | Bar, ring, rail — one idea at three scales |
| `states` | Empty, error, locked, unavailable-in-locale |
| `skeletons` | Layout-identical, component-level |
| `meta` | Duration, counts, concept chips, free-preview, market figures |
| `theme-toggle` | Light / dark / system |

### What the course card deliberately does not have

Udemy's card carries a price, a struck-through price, a rating, a rating count, a "Bestseller" flag and an instructor name. All six exist to convert a one-off purchase.

None of them appear here. Access is one all-access subscription ([ADR-0001](decisions/0001-subscription-only-single-publisher.md)), and we are the sole publisher and do not invent social proof ([ADR-0002](decisions/0002-no-fictional-instructors.md)). What survives is the argument from depth: how long the course is, how much of it there is, and how far you have got.

### Covers

`CourseCover` renders real artwork when `coverImageUrl` is set, and otherwise draws a deterministic abstract figure from the course id — a gradient mixed from the three cool chart hues plus a line that behaves like a price series.

Generated rather than stock photography, for two reasons. A stock photo of a trading desk reads as real editorial and quietly becomes permanent, which rule 1 forbids; an abstract figure never will. And a 40-course catalog looks finished on day one with no art budget spent before anyone has read a lesson. The mix is constrained to indigo/cyan/emerald so a catalog page reads as one wall instead of a swatch book.

### No gamification

No levels, XP, points, streaks or achievement badges. Progress, review and resume are welcome; the scoring furniture of a game is not. Completion is marked, not applauded — see `progress.tsx`.

Concept chips are the one place a "you know this" state appears, and it is a filled check on a squared chip, not a reward.

## Strings

**No component in `components/margin/` contains a user-facing string.** Every visible word arrives as a prop.

That is AGENTS.md rule 7 working rather than a shortcut around it: `next-intl` is not installed yet, and a component that hardcodes "Beginner" is a component that gets rewritten when it is.

**Client components take plain strings only** — functions cannot cross the server/client boundary as props. So per-entity labels are records keyed by id (`CurriculumLabels.lessonDuration`) or pre-formatted arrays (`QuizLabels.positions`), built on the server where `next-intl` will live. Server-only components (the chart) may still take formatter functions.

## Fixtures

[lib/fixtures/content.ts](../lib/fixtures/content.ts) types and data match [content-model.md](content-model.md), which asks for exactly this: *"build components against fixtures in this shape."* When Phase 1 lands, the types become the Drizzle inferred types and the data becomes real queries — nothing in `components/margin/` should need to change.

## Open

- **`next-intl` is not installed.** Until it is, callers pass English literals. The component contracts are already the right shape.
- **No arbitrary-value lint rule yet.** The token layer makes primitives unreachable, but nothing currently stops `p-[13px]` or `text-[#0af]`. That rule is the missing half of "tokens only" and should land before the app shell.
- **`Course.level`** exists in the content model but has no UI treatment, by decision — level badges read as gamification. Re-add as plain metadata if the catalog needs it.
- **`/design-system` is unauthenticated.** It is `noindex` and leaks no data. Gate it behind the [debug-access](../lib/observability/debug-access.ts) token if that changes.
