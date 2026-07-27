# Roadmap

## Sequencing principle

**Sequence by who gets unblocked, not by what is visible.**

Content production is the long pole — content takes months, code takes weeks. The content author must never be blocked waiting on the platform. This is why admin comes before the public catalog, even though the catalog is more satisfying to build.

**Corollary: no module is built to completion before the others start.** The highest risk in a framework-first build is the content model being wrong — if the author writes 40 lessons against a bad schema, that work is redone by hand. Phase 6 exists solely to test the schema end-to-end while being wrong is still cheap.

Sizes are relative effort, not dates. `S` ≈ days, `M` ≈ a couple of weeks, `L` ≈ a month or more, solo.

---

## Phase 0 — Foundations · S

Repo conventions, TypeScript config, structured logging with request IDs, Sentry, PostHog (EU cloud), CNIL-compliant consent gating, environment management, deploy pipeline.

**Done when:** an error in production reaches Sentry with a request ID, and a pageview reaches PostHog only after consent.

## Phase 1 — Content schema + i18n model · M

The contract. See [content-model.md](content-model.md). Postgres schema via Drizzle: courses, chapters, lessons, typed blocks, concepts, per-locale translation rows with per-locale publish status.

**This phase gets the most scrutiny of any phase.** Everything downstream is a read view over it, and the content author's work is unmigratable by machine if it is wrong.

**Done when:** the schema round-trips a realistic lesson — multiple block types, FR published, EN draft.

## Phase 2 — Design tokens + base components · M

Tailwind 4 theme tokens, typography scale, colour system for light/dark, shadcn/ui primitives installed and adapted. Loading, empty, error, and locked states designed as first-class components.

**Done when:** a page can be built without inventing a single new colour, spacing value, or one-off component.

**Do not perfect this.** It will change once real content exists.

## Phase 3 — App shell · S

Three shells: public (marketing/catalog), app (study), admin. Navigation, locale switching, responsive layout. The shell must render instantly and never blink on navigation — see [ux-architecture.md](ux-architecture.md).

**Done when:** navigating between routes never re-renders the navigation.

## Phase 4 — Auth + roles · M

Supabase Auth: email/password, magic link, Google. Roles: `visitor`, `student`, `editor`, `admin`. Session handling in server components. Account pages: profile, language preference, password, delete account (GDPR).

**Done when:** an `editor` can reach admin routes and a `student` cannot, enforced server-side.

## Phase 5 — Entitlement boundary (stubbed) · S

One function, `canAccess(user, resource)`, backed by a subscription status field on the user. **Stripe is not integrated in this phase.** A dev-only toggle sets subscription status.

Every gate in the product calls this and nothing else. See [ADR-0006](decisions/0006-entitlement-boundary-before-billing.md).

**Done when:** a free lesson and a paid lesson behave differently, with no payment provider present.

## Phase 6 — Walking skeleton · S

One course, one chapter, three lessons. Authored crudely in admin → listed in catalog → played in study. Deliberately ugly, deliberately end-to-end.

**Done when:** the content author has written a real lesson and read it back as a student.

**This is the schema test.** If Phase 1 was wrong, this is where it surfaces, and fixing it here is free.

## Phase 7 — Admin content studio · L

The real thing: block editor, media upload, draft/review/publish per locale, versioning, preview-as-student, categories and ordering, bulk operations, publish-triggered cache invalidation.

Optimise for one metric: **minutes to publish a lesson.**

**Done when:** the content author can work all day without asking a developer for anything.

## Phase 8 — Catalog (public) · M

Course grid, categories and filters, course detail pages, curriculum accordion, free previews, favorites, locked-state design, landing page, SEO (metadata, sitemaps, hreflang, structured data).

Take Udemy's information architecture. Do not take its commerce psychology — see [ADR-0001](decisions/0001-subscription-only-single-publisher.md).

**Done when:** a stranger can find us via search and understand what they would be paying for.

## Phase 9 — Study area v1 (linear) · L

Enrolment, lesson player rendering every block type, progress and resume, completion, notes, bookmarks, "continue where you left off" dashboard, course completion.

**No AI, no adaptivity yet.** A genuinely good linear course player.

**Done when:** someone can finish a whole course and feel it was worth paying for.

## Phase 10 — Stripe + paywall activation · M

Stripe subscriptions behind the Phase 5 boundary, Stripe Tax for EU VAT, Customer Portal for billing self-service, webhooks, trial, dunning, lifecycle email via Resend.

**Done when:** a real person pays and gains access without manual intervention.

---

**Everything above is the platform. Everything below is the differentiator.**

---

## Phase 11 — AI layer · M

Contextual tutor inside the lesson (knows the lesson, the chart, the learner's level and recent mistakes), "explain differently", auto-graded quizzes with explanations, lesson summaries. `pgvector` retrieval over published content.

Bolts onto the existing player. No re-architecture required — that is the point of the earlier phases.

## Phase 12 — The journey · L

Concept mastery tracking, placement diagnostic, "what to do next", spaced repetition and review sessions, personalised ordering. The catalog quietly becomes a path.

This phase is only cheap if [ADR-0004](decisions/0004-content-structure-and-concepts.md) was honoured in Phase 1. If mastery was stored per-lesson, this is a rewrite.

## Phase 13 — Depth · ongoing

Certificates, simulated portfolio, live market data, streaks and gamification, community, mobile, additional locales.

---

## Deferred deliberately

Cart, coupons, multi-instructor anything, live market data, mobile apps, community, video pipeline, affiliate program, search vendor, Redis, monorepo. Each is implied by the prototype or tempting on its own; none earns its cost before Phase 11.
