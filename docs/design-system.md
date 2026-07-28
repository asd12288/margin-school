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

The ramps are `neutral` · `indigo` (primary) · `violet` (brand accent) · `cyan` (charts) · `emerald` (success, gain) · `rose` (loss) · `amber` (warning, risk) · `red` (destructive).

### Roles beyond shadcn's vocabulary

shadcn ships `primary / muted / accent / destructive`. This product needs more, and these are the additions:

- `subtle`, `border-strong`, `highlight` — surfaces and lines
- `brand`, `brand-foreground`, `brand-muted`, `brand-muted-foreground` — the vivid accent, **distinct from `--accent`**. shadcn's `--accent` is not a brand colour: it is the subtle interactive surface behind menu highlights, hovers and selected rows, used in 47 places across the vendored components. Defining it as a saturated colour painted a loud bar behind every dropdown item, and chasing text contrast on it then forced it dark and muddy. `--accent` is neutral again; `--brand` is the colour that was actually wanted
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
| `animate-modal-in` / `-out` | Modal open/close | `dialog`, `alert-dialog` |
| `animate-menu-in` / `-out` | Menu dropdown | `dropdown-menu`, `select`, `popover`, `context-menu`, `menubar`, `hover-card`, `combobox` |
| `animate-tooltip-in` / `-out` | Tooltip open/close | `tooltip` |
| `animate-panel-reveal` | Panel reveal | Empty / error / locked / unavailable states, accordion content |
| `animate-texts-reveal` | Texts reveal | Lesson header — staggered rise and unblur |
| `animate-skeleton-pulse` | Skeleton loader | `ui/skeleton`, so every placeholder inherits it |
| `animate-success-check` | Success check | Quiz correct answer — fade, rotate, blur, settle-bob, plus the tick drawing itself |
| `animate-error-shake` | Error state shake | Quiz wrong answer — deliberately small; a violent shake reads as punishment |
| `icon-swap-slot` / `-shown` / `-hidden` | Icon swap | Curriculum lesson glyph (check ↔ play in one cell) |
| *(chevron flip)* | Accordion expand | `ui/accordion` — `scaleY(-1)`, not a `d:` path morph, which is Chromium-only |

**The characteristic worth having is that open and close are not symmetric.** Opening is an intention and gets the slower curve; closing is getting out of the way. shadcn ships one duration for both, which is what makes stock dialogs feel slightly sticky on dismiss. Mapped by usage rather than by number: the recipes' 250ms open is our `--duration-base`, their 150ms close is our `--duration-fast`.

Radix sets `--radix-popper-transform-origin` on positioned content, so the origin-aware growth the dropdown recipe orchestrates in JS comes free — the utilities deliberately do **not** set `transform-origin`, leaving each component's own `origin-(--radix-…)` class to win.

**Tabs sliding** is the one recipe that genuinely needs JavaScript. A pill cannot tween between two siblings' boxes, so `TabsList` owns a single indicator element, measures the active trigger and writes its offset and size; CSS owns the tween. Upstream paints the active state on the trigger itself, which is why stock tabs snap — that background and the line variant's `::after` underline both had to move onto the indicator, or you get a second stationary pill under the travelling one.

Three details in there are load-bearing:

- **The transition stays armed and is suspended only around un-animated writes**, never the reverse. Parking at `data-animate="false"` and flipping to `"true"` alongside the new position silently kills the tween — a transition only starts if the property was already transitionable in the previous computed style, and doing both in one recalculation means it never was.
- **First paint and resize must not animate**, or the pill flies in from `translateX(0)` at `width: 0` and lurches after every resize.
- **A `MutationObserver` on `data-state`, not a click handler** — so keyboard and programmatic changes move the pill too. A `ResizeObserver` on the list and every trigger covers late-loading fonts and locale switches, where French labels run 15–20% longer.

Not applied, and why: **page side-by-side** and **like button** target surfaces that do not exist yet (the study-area player, favourites); **notification badge**, **plus-to-menu morph**, **spinning counter** and **card tilt** have no home in the current UI or read as flashier than the product should. The skeleton recipe's content cross-fade is also unbuilt — nothing streams real data yet, so it would be dead CSS.

## Responsive

Audited at 375px by measuring rather than eyeballing. No element overflows the viewport and the document does not scroll horizontally.

Two things the audit turned up:

- **The chart.** Its axis labels rendered at **6px** on a phone, because a 720-unit viewBox scaled into 343px shrinks the type with everything else. The figure now scrolls horizontally inside `chart-scroll` below `34rem` and the axis type is set at 13 units, so labels never render under ~10px. A price chart has an irreducible amount of detail; swiping it is honest, squinting at it is not.
- **Touch targets.** Checkbox, radio and switch measure 16–18px visually, which looks like a WCAG 2.5.8 failure and is not — all three already carry `after:-inset-x-3 after:-inset-y-2`, so the real hit area is comfortably over 24px. A pseudo-element does not show up in `getBoundingClientRect`, which is what makes this easy to "fix" twice.

Course card titles are 20px links, which is also fine: the whole card is the target via `after:absolute after:inset-0`.

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
| `auth/*` | Two-column auth frame, form parts, choice cards, the four auth forms |

### What the course card deliberately does not have

Udemy's card carries a price, a struck-through price, a rating, a rating count, a "Bestseller" flag and an instructor name. All six exist to convert a one-off purchase.

None of them appear here. Access is one all-access subscription ([ADR-0001](decisions/0001-subscription-only-single-publisher.md)), and we are the sole publisher and do not invent social proof ([ADR-0002](decisions/0002-no-fictional-instructors.md)). What survives is the argument from depth: how long the course is, how much of it there is, and how far you have got.

### Covers

`CourseCover` renders real artwork when `coverImageUrl` is set, and otherwise draws a deterministic abstract figure from the course id — a gradient mixed from the three cool chart hues plus a line that behaves like a price series.

Generated rather than stock photography, for two reasons. A stock photo of a trading desk reads as real editorial and quietly becomes permanent, which rule 1 forbids; an abstract figure never will. And a 40-course catalog looks finished on day one with no art budget spent before anyone has read a lesson. The mix is constrained to indigo/cyan/emerald so a catalog page reads as one wall instead of a swatch book.

### The auth screens

Form left, decoration right, and the right column disappears below `lg`. The form is first in the DOM, so reading order and tab order reach the inputs without traversing marketing copy — the responsive choice and the accessible one agree here.

What the right column may hold is constrained by [ADR-0002](decisions/0002-no-fictional-instructors.md): no testimonials, no ratings, no student counts, no faces. What is left is the argument from depth, plus the risk disclaimer — which appears on the way in, not only in the footer, because this is where someone decides to buy a financial-education product.

The figure behind it is a **fixed, invented** price series, server-rendered as SVG with no client JS. Invented because a real chart on a sign-up screen reads as a market claim; fixed rather than generated because it is one figure in one place. It sits at 45% opacity under a gradient wash — at full strength the stroke was the loudest thing on the screen and crossed the headline at whatever height the viewport happened to put it, so the copy's contrast moved with the window.

**Choice cards are native `<input type="radio">`, not Radix.** A native group inside a `<fieldset>` gives arrow-key navigation, "2 of 4" announcements, and a form that submits without JavaScript — which matters most on `/onboarding`, since it blocks ([ADR-0012](decisions/0012-blocking-onboarding.md)) and a JS-only door is one some people cannot open. The input is `sr-only` rather than `display: none`, because a hidden input is not focusable and the keyboard behaviour goes with it.

One line per choice, with an icon instead of a description. The cards first shipped with a sentence under every label; four questions each explaining themselves turned a thirty-second form into a page of prose. The icon distinguishes the options at a glance without adding a line to read. Icons cross the server/client boundary as **names**, not components — a component is not serializable as a prop — and `ChoiceGroup` resolves them against its own registry.

> `peer-checked:` compiles to `.peer:checked ~ &`, so it only reaches the input's **siblings**. Styling a grandchild (the tick, the icon) with it silently does nothing. The checked styles for those are declared on the sibling wrapper and reach down by descendant selector.

### No gamification

No levels, XP, points, streaks or achievement badges. Progress, review and resume are welcome; the scoring furniture of a game is not. Completion is marked, not applauded — see `progress.tsx`.

Concept chips are the one place a "you know this" state appears, and it is a filled check on a squared chip, not a reward.

## Strings

**No component in `components/margin/` contains a user-facing string.** Every visible word arrives as a prop.

That is AGENTS.md rule 7 working rather than a shortcut around it: `next-intl` is not installed yet, and a component that hardcodes "Beginner" is a component that gets rewritten when it is.

**Client components take plain strings only** — functions cannot cross the server/client boundary as props. So per-entity labels are records keyed by id (`CurriculumLabels.lessonDuration`) or pre-formatted arrays (`QuizLabels.positions`), built on the server where `next-intl` will live. Server-only components (the chart) may still take formatter functions.

## Fixtures

[lib/fixtures/content.ts](../lib/fixtures/content.ts) types and data match [content-model.md](content-model.md), which asks for exactly this: *"build components against fixtures in this shape."* When Phase 1 lands, the types become the Drizzle inferred types and the data becomes real queries — nothing in `components/margin/` should need to change.

## Enforcement

Three things stop the system drifting, and none of them rely on anyone remembering:

1. **Primitives are unreachable.** The ramps stay out of `@theme`, *and* Tailwind's own palette is cleared with `--color-*: initial`. Without that second half the first is an illusion — Tailwind ships `indigo`, `red`, `neutral` and nineteen more, so `bg-indigo-600` resolved happily to *Tailwind's* indigo, a different colour from the brand with nothing to signal it.
2. **A lint rule bans arbitrary design values.** `bg-[#0af]`, `p-[13px]`, `text-[11px]` fail the build. Structural escapes stay legal — `transition-[…]` is a property list, `grid-cols-[repeat(…)]` is a layout algorithm, `data-[state=open]:` is a variant. Scoped to our code; `components/ui/**` is vendored and excluded.
3. **Tests assert the invariants**, including the ones a human eye cannot check.

## Tests

```bash
npm test        # vitest — tokens, progress maths, cover determinism, fixtures
npm run test:e2e   # playwright — a11y, contrast, theme, tabs; runs a prod build
```

`tests/unit/tokens.test.ts` compiles the real stylesheet and asserts which class names produce rules — that semantic roles do and primitive ramps do not. It is the test that would have caught the palette collision above, and it did.

`tests/e2e/contrast.spec.ts` measures contrast on the rendered page in both themes. It converts `lab()` (what the browser actually returns) to linear sRGB and composites alpha over the page background — a translucent `--secondary` reads as ~1:1 otherwise, which would either fail the build for nothing or pass something unreadable. It self-checks by asserting white-on-black is exactly 21.

### What the suite caught

Every accessibility failure it found was real except one class, and that
exception is worth knowing about: axe was scanning *during* the entrance
animations and measuring half-faded elements, reporting five contrast
violations that do not exist once the page is at rest. The tempting fix — darken
the palette until the scan goes quiet — would have made the design worse to
satisfy a measurement error. The suite now waits for animations to settle,
filtering out the infinite skeleton pulse whose `finished` promise never
resolves.

The genuine finds, all now fixed:

- **A colour used as a fill and as text needs two values in a dark theme.** The
  saturated primary works as a button but measured 3.99:1 as a label on
  near-black. Hence `--primary-text` and `--destructive-text`, one surface
  further out than `*-muted-foreground`.
- **Callout titles used solid roles as text on their own tint** — the risk
  callout, which is the one that is legally required to be readable.
- **The chart's scroll region was keyboard-unreachable.** It only overflows on
  narrow screens, so it passed every desktop check while stranding phone and
  keyboard users.

## Open

- **`next-intl` is wired, with URL routing.** `/fr/…` and `/en/…`, both prerendered (`●` in the build output), messages in `messages/{fr,en}.json`.

  Two things to know when building on it. **Import `Link` from [i18n/navigation.ts](../i18n/navigation.ts), never `next/link`** — the wrapper carries the active locale, and a bare link drops a French reader onto the default locale, a bug only visible to the users you are not. And **`setRequestLocale` is required in every layout *and* page** that should be static; skip it and everything still works while silently rendering dynamically, which is what cost Tier 1 before the segment existed.
- **`Course.level`** exists in the content model but has no UI treatment, by decision — level badges read as gamification. Re-add as plain metadata if the catalog needs it.
- **`/design-system` is unauthenticated.** It is `noindex` and leaks no data. Gate it behind the [debug-access](../lib/observability/debug-access.ts) token if that changes.
