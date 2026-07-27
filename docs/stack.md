# Stack

Chosen for a solo developer plus one content author. The bias is toward fewer vendors, boring technology, and escape hatches that actually work.

## Decided

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16.2.12**, App Router | Cache Components and PPR map directly onto the three-tier loading model |
| Runtime | React 19.2.4, TypeScript 5 | — |
| Hosting | **Vercel** | Only host with first-class Next 16 caching support |
| Database | **Supabase Postgres**, EU region | Relational content model; EU residency for GDPR |
| ORM | **Drizzle** | TypeScript-native, SQL-shaped, clean migrations, does not fight server components |
| Auth | **Supabase Auth** | Email, magic link, Google. Free with the database |
| Styling | **Tailwind 4** | — |
| Components | **shadcn/ui** + Radix | We own the code, so design tokens actually apply |
| i18n (UI) | **next-intl** | Mature App Router support |
| Payments | **Stripe** + Stripe Tax + Customer Portal | See [ADR-0007](decisions/0007-stripe-direct.md) |
| Email | **Resend** + React Email | Transactional and lifecycle. Subscription products live on lifecycle email |
| Media | **Supabase Storage** (images, PDFs) | Video deferred; when needed, **Mux**. Never self-host video |
| Search | **Postgres full-text** | At catalog scale, a search vendor is pure overhead |
| Jobs | **Vercel Cron** → Inngest when workflows get real | Spaced repetition, digests, stale-content detection |
| AI | **Vercel AI SDK v6** via **AI Gateway**; `pgvector` for retrieval | Gateway gives failover, cost tracking, no provider lock-in. pgvector keeps RAG in the database we already have |
| Errors | **Sentry** | — |
| Analytics | **PostHog** (EU cloud) | Also provides feature flags — use them to hide unfinished modules in production |
| Testing | **Vitest** + **Playwright** | Light early, but E2E the money path: signup → subscribe → access |

## Architectural rules

**The browser never talks to Supabase directly.** All data access goes through server components, server actions, or route handlers. RLS stays on as defense-in-depth, but it is not the access layer.

*Why:* entitlement logic, AI calls, and progress writes belong in one auditable place. Teams that let the client query directly end up with business rules scattered across RLS policies, which is miserable to debug and impossible to test.

**Drizzle owns the schema.** Migrations are code, in the repo, reviewed. Never change the schema from the Supabase dashboard — a dashboard edit that is not in a migration will be silently reverted by the next deploy.

**Content and user data are separate domains.**
- *Content* — courses, chapters, lessons, blocks, translations. Read-mostly, published, cacheable, translatable.
- *User data* — progress, mastery, favorites, subscriptions, notes. Transactional, never cached, never public.

Keep the boundary clean even though both live in the same Postgres. It is what allows the content layer to be cached aggressively and the CMS to be replaced later without touching a single user record.

## Open

**Admin authoring: Payload CMS vs custom build.** See [ADR-0008](decisions/0008-admin-cms-choice.md). Must be decided before Phase 7. Does not block Phases 0–6.

## Rejected, and why

| Not using | Reason |
| --- | --- |
| Merchant of record (Paddle, Lemon Squeezy, Polar) | Considered seriously for EU VAT relief; Stripe chosen deliberately — see [ADR-0007](decisions/0007-stripe-direct.md) |
| Prisma | Drizzle is lighter and keeps queries legible as SQL |
| Redis | Nothing needs it yet. Next's cache covers current needs |
| Separate backend (Nest, Express) | Server actions and route handlers are sufficient |
| GraphQL | One client, one team. Pure overhead |
| Monorepo | One app, one developer. Revisit if mobile happens |
| Algolia / Typesense | Postgres full-text is enough at this catalog size |
| Self-hosted video | Never a good trade |
| A component library we do not own | Fights design tokens; blocks the ownership shadcn gives us |

## Compliance

- EU data residency: Supabase EU region, PostHog EU cloud.
- CNIL-compliant consent banner gating analytics **before it loads**, not after.
- Stripe Tax for EU VAT; we are the merchant of record and file our own returns.
- Risk disclaimers on educational content. Never advice, signals, or buy/sell recommendations.
