# Architecture decision records

Why things are the way they are. An agent or developer who does not know *why* a decision was made will cheerfully undo it — and several decisions here look like omissions rather than choices (no cart, no instructors, mastery not on lessons).

**Before removing or working around anything that seems missing, check whether it is missing on purpose.**

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-subscription-only-single-publisher.md) | Subscription-only, single publisher | Accepted |
| [0002](0002-no-fictional-instructors.md) | No fictional instructors or invented social proof | Accepted |
| [0003](0003-tech-stack.md) | Next.js + Vercel + Supabase + Drizzle | Accepted |
| [0004](0004-content-structure-and-concepts.md) | Concepts separate from course structure | Accepted |
| [0005](0005-three-tier-loading.md) | Three-tier loading architecture | Accepted |
| [0006](0006-entitlement-boundary-before-billing.md) | Entitlement boundary before billing | Accepted |
| [0007](0007-stripe-direct.md) | Stripe direct, not a merchant of record | Accepted |
| [0008](0008-admin-cms-choice.md) | Admin authoring: Payload vs custom | **Open** — decide before Phase 7 |
| [0009](0009-french-english-day-one.md) | French and English from day one | Accepted |
| [0010](0010-no-staging-database.md) | Preview shares the production database | Accepted — **time-boxed** |
| [0011](0011-route-map.md) | Route map, localized paths, no dashboard | Accepted |

## Format

Context → Decision → Consequences → Alternatives rejected. Short. If an ADR needs more than a page, the decision is probably two decisions.

When a decision changes, add a new ADR that supersedes the old one. Do not edit history — the superseded reasoning is what stops the same debate recurring.
