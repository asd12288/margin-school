# ADR-0005 — Three-tier loading architecture

**Status:** Accepted · 2026-07-27

## Context

Two failure modes are common and both are avoidable. Skeleton-everything makes a fully cacheable marketing page flash grey for no reason and wrecks SEO. Spinner-everything makes an instant optimistic action feel broken.

Next 16's Cache Components, PPR and Suspense make per-route treatment cheap — but only if the choice is deliberate.

## Decision

Every route is explicitly assigned one of three tiers. Full rules in [ux-architecture.md](../ux-architecture.md).

| Tier | Treatment | Applies to |
| --- | --- | --- |
| **1 — Prerendered** | No loading state at all | Marketing, catalog, course detail, free previews |
| **2 — Instant shell, streamed data** | Cached frame, Suspense around personal regions | Dashboard, study area, admin lists |
| **3 — Optimistic** | No spinner ever; update, reconcile, roll back | Mutations: complete, favorite, note, answer |

Supporting rules: skeletons are layout-identical, never cover the shell, are component-level rather than page-level, and are omitted below ~300ms.

Routes that must navigate instantly export `unstable_instant`, which validates Suspense placement at dev and build time.

## Consequences

- Choosing a tier becomes part of creating a route — the decision is made once, at the right moment, rather than discovered in production.
- `loading.tsx` at route level is discouraged; it blinks the whole screen. Suspense goes around the specific slow region instead.
- Content caching must be tagged so publishing can invalidate precisely. This is a constraint on the admin, not just the frontend.
- Cached content and personal data must never be fetched in the same cached function. This shapes how data access is written, not only how pages render.
- `unstable_instant` is unstable by name. Accepted: the failure it catches — a misplaced boundary that silently blocks client navigation — is otherwise found only by users.

## Alternatives rejected

**One global convention.** Simpler to explain, wrong in at least one direction on most routes.

**Client-side fetching everywhere.** Kills SEO, which is the primary acquisition channel. Non-starter.
