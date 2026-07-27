# ADR-0003 — Next.js + Vercel + Supabase + Drizzle

**Status:** Accepted · 2026-07-27

## Context

One developer plus one content author. Content-heavy, SEO-dependent, EU/French audience, AI features planned for later phases. Next.js 16 / React 19 / Tailwind 4 were already scaffolded.

## Decision

Next.js 16 App Router on Vercel · Supabase Postgres (EU region) for database, auth and storage · Drizzle as ORM · shadcn/ui on Tailwind 4 · next-intl · Resend · Sentry · PostHog (EU) · Vitest and Playwright. Full table in [stack.md](../stack.md).

## Consequences

**Supabase collapses three vendors into one** — Postgres, auth and storage, EU-hosted, one dashboard. Auth alone is weeks of work not worth doing by hand. The escape hatch is genuine: the database is plain Postgres, so leaving means taking the data and schema intact. Auth is the only truly sticky piece.

**The browser never talks to Supabase directly.** All access goes through server components, server actions, or route handlers. RLS stays on as defense-in-depth but is not the access layer.

*Why this matters:* entitlement, AI calls and progress writes belong in one auditable, testable place. Projects that let the client query directly end up with business rules spread across RLS policies — hard to debug, hard to test, impossible to reason about when a rule changes.

**Drizzle owns the schema.** Migrations live in the repo and are reviewed. Schema changes made in the Supabase dashboard are not in a migration and will be silently reverted by the next deploy.

**Vercel is chosen for Cache Components and PPR specifically**, which the loading architecture ([ADR-0005](0005-three-tier-loading.md)) depends on. This is real coupling, accepted knowingly.

## Alternatives rejected

| Option | Why not |
| --- | --- |
| Neon + Better Auth + separate storage | More assembly, more control. Fine choice; Supabase wins on solo-developer velocity |
| Prisma | Heavier; Drizzle keeps queries legible as SQL |
| Separate backend (Nest, Express) | Server actions and route handlers suffice |
| GraphQL, Redis, monorepo, search vendor | Reasonable at scale, pure drag at zero users |
| A component library we do not own | Fights design tokens and blocks the ownership shadcn provides |
