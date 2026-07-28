# 11. Route map, localized paths, and no dashboard

**Status:** Accepted · 2026-07-27

## Context

Phase 3 needed shells, and shells need URLs. URLs are the one thing a public
product cannot revise cheaply: changing them costs redirects, search equity and
every link anyone has shared. So the whole map was settled at once, including
routes that phases 8 through 12 will fill in — see the table in
[ux-architecture.md](../ux-architecture.md#routes).

## Decision

**The signed-in home is `/learn`, and there is no dashboard.** Its job is one
sentence and one button: what to do now, and how long it takes.

**The public lesson URL is the paywall.** One canonical URL per lesson, always
rendering — the full lesson when free or entitled, the designed locked state
otherwise. The player at `/learn/…` is a second URL for the same lesson,
`noindex`, canonical pointing at the public one. Neither the lesson URL nor the
player exists yet (both are Phase 9); the shape is decided now because it drives
`/course/[course]` and `/learn` today.

**Path segments are translated per locale.** `/fr/catalogue`, `/en/courses`.

**One second taxonomy — `/concepts`** — the skill graph of ADR-0004 made public.
Reserved, not built before Phase 8.

## Consequences

A beginner's first screen after signing in is an instruction, not a console —
which is what product.md asks for and what keeps the gamification furniture
design-system.md bans from having anywhere to live.

The paywall becomes an acquisition surface: a stranger arriving from search
lands on the lesson itself and meets the upsell in context.

Translated segments mean `proxy.ts` must match the canonical path from
next-intl's rewrite, not the raw pathname — otherwise protected routes silently
stop protecting French URLs. `tests/e2e/auth-routing.spec.ts` covers both
locales through the real proxy.

French forced a naming decision English hides: `cours` is invariable, so
`/courses` and `/course/[slug]` cannot both become `/cours/…`. Hence `catalogue`
for browsing. Every locale added later needs the same collision check, which
`tests/unit/routing.test.ts` enforces.

## Alternatives rejected

**A dashboard.** Standard for the category, and wrong here: a new subscriber's
dashboard is an empty room, and it invites streaks, XP and progress furniture.

**Udemy's untranslated segments.** It serves French visitors
`/fr/courses/finance-and-accounting/` and ships those pages with no `hreflang`
at all. Defensible for an English-first global marketplace; wrong for a
French-first product whose acquisition channel is search.

**Three parallel taxonomies** (`/topic`, `/browse`, `/career`). A search
land-grab that needs a catalog we do not have.

**A separate public URL for free previews.** Splits one lesson's search
authority across two addresses and makes the locked state a redirect instead of
a designed surface.
