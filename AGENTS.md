# Margin School

Subscription platform teaching financial markets, beginner-first, in French and English.
We are the sole publisher: we produce all content. There are no external instructors and nothing is sold per course.

**Status: Phases 0–5 of [docs/roadmap.md](docs/roadmap.md) are built** — foundations, design system, app shell, auth and roles, and the entitlement boundary. `canAccess` now exists in [lib/entitlement/can-access.ts](lib/entitlement/can-access.ts) and every locked surface goes through it, with a local-only toggle at `/debug/subscription` standing in for Stripe. There is still **no content schema**: the catalog renders from fixtures, so what the boundary gates is fixture data. Decisions still live in the docs rather than in the code, so read them first — but the code is now real enough to be worth reading too.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands

Node 24 (`.nvmrc`) — run `fnm use` first. Local development needs the Docker stack running.

```bash
npm run db:start    # start local Supabase (Postgres, Auth, Storage, Studio, mail)
npm run dev         # dev server on the host — http://localhost:3000
npm run build       # production build
npm run lint        # eslint

npm run db:generate # schema change → SQL migration (review it by hand)
npm run db:studio   # database UI    → http://127.0.0.1:54323
npm run mail        # auth emails    → http://127.0.0.1:54324
npm run db:reset    # wipe and re-run all migrations
npm run db:status   # local stack credentials
npm run db:stop     # stop the stack
```

## Read before you write

| If you are working on | Read |
| --- | --- |
| Anything at all, first time | [docs/product.md](docs/product.md) |
| Sequencing, "what do we build next" | [docs/roadmap.md](docs/roadmap.md) |
| Libraries, services, versions | [docs/stack.md](docs/stack.md) |
| Courses, lessons, blocks, i18n, progress | [docs/content-model.md](docs/content-model.md) |
| Tokens, components, typography, motion | [docs/design-system.md](docs/design-system.md) |
| Any route, page, loading or empty state | [docs/ux-architecture.md](docs/ux-architecture.md) |
| Env vars, local setup, how the tools are wired | [docs/environments.md](docs/environments.md) |
| Adding analytics events or error handling | [docs/observability.md](docs/observability.md) |
| Why something is the way it is | [docs/decisions/](docs/decisions/) |

## Hard rules

These are decisions, not preferences. If one blocks you, stop and ask — do not route around it.

1. **Never invent people or social proof.** No instructor names, bios, photos, testimonials, ratings, or student counts. The brand teaches; no fictional experts. Placeholder content must be obviously placeholder. See [ADR-0002](docs/decisions/0002-no-fictional-instructors.md).
2. **No commerce per course.** No cart, checkout, price tag, coupon, or discount timer anywhere. Access is one all-access subscription. See [ADR-0001](docs/decisions/0001-subscription-only-single-publisher.md).
3. **Content and user data stay separate.** Content is read-mostly, cacheable, translatable. User data (progress, mastery, subscription) is transactional and never cached. Never join them inside a cached function.
4. **Mastery attaches to concepts, never to lessons.** Lessons track completion only. See [ADR-0004](docs/decisions/0004-content-structure-and-concepts.md).
5. **The browser never talks to the database.** All data access goes through server components, server actions, or route handlers. RLS is defense-in-depth, not the access layer.
6. **Every route declares a loading tier** (prerendered / streamed / optimistic). Never add a spinner without checking [docs/ux-architecture.md](docs/ux-architecture.md).
7. **Every user-facing string is translatable, FR and EN.** Never hardcode display text.
8. **Access checks go through the entitlement boundary** (`canAccess`). Never check subscription status inline. See [ADR-0006](docs/decisions/0006-entitlement-boundary-before-billing.md).
9. **`.env.local` points at local Docker only.** Never put cloud credentials in it and never run `vercel env pull` for daily development.
10. **Read the environment from `lib/env.ts`.** Never branch on `NODE_ENV` or `VERCEL_ENV` directly.
11. **Track events with `capture()` from `lib/analytics/posthog.ts`**, never `posthog.capture` directly. Event names are `snake_case` verb phrases. Never put personal data in properties. Add a flow's events in the same change as the flow.
12. **Every processor stays in the EU.** Check a service's region before adding it.

## Keeping these docs true

Stale context is worse than no context. When a decision changes, update the doc and its ADR in the same commit as the code. If a doc contradicts the code, say so rather than silently following one of them.
