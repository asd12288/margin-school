# Environments

Three environments. The rule that makes them safe is simple: **local development never touches cloud data, and preview never touches production data.**

| | Local | Preview | Production |
| --- | --- | --- | --- |
| `APP_ENV` | `local` | `preview` | `production` |
| App | `next dev` on the host | Vercel preview deploy per branch | Vercel production |
| Database | Supabase Docker stack | **shares production** — deliberate, see [ADR-0010](decisions/0010-no-staging-database.md) | Supabase `margin-school`, Paris (`eu-west-3`) |
| Sentry | off unless opted in | on, tagged `preview` | on, tagged `production` |
| PostHog | off unless opted in | on, tagged `preview` | on, tagged `production` |
| Env source | `.env.local` (git-ignored) | Vercel, Preview scope | Vercel, Production scope |

`APP_ENV` is resolved once, in [`lib/env.ts`](../lib/env.ts), from `NEXT_PUBLIC_APP_ENV` and falling back to Vercel's own `VERCEL_ENV`. Nothing else in the codebase should sniff the environment.

## Local

Everything stateful runs in Docker via the Supabase CLI — Postgres, Auth, Storage, Realtime, Studio, and a mail catcher. Versions match production (Postgres 17.6), and the stack is disposable.

```bash
npm run db:start     # start the Docker stack
npm run dev          # Next dev server on the host
npm run db:studio    # database UI      → http://127.0.0.1:54323
npm run mail         # auth emails      → http://127.0.0.1:54324
npm run db:reset     # wipe and re-run all migrations
npm run db:stop      # stop the stack
```

**The app runs on the host, not in Docker.** Docker holds the stateful services; the Next process is stateless and gains nothing from a container while losing meaningful hot-reload speed to macOS bind mounts.

### Rules

1. **`.env.local` points at local Docker only.** Never put cloud credentials in it.
2. **Never run `vercel env pull`** for daily development. It overwrites `.env.local` with cloud credentials, and that is how someone eventually truncates a production table from their laptop. If you need to inspect deployed config, use `vercel env ls`.
3. Regenerate `.env.local` any time from `supabase status -o env` — see [`.env.example`](../.env.example).
4. Node is pinned to 24 (`.nvmrc`) to match Vercel. `fnm use` before working.

## Preview

Every branch gets a Vercel preview deployment. Sentry and PostHog are live and tagged `preview`, so preview traffic is visible but never mixed into production analysis.

**Preview shares the production database.** This is a deliberate, time-boxed decision — there is no schema and no user data yet, so a separate staging project would cost money to protect nothing. See [ADR-0010](decisions/0010-no-staging-database.md) for the trigger that reverses it: **before the first real user data exists.** After that point, a preview deploy writing to production is a genuine incident risk.

Preview deployments are behind Vercel Deployment Protection (SSO). Automated checks need a **Protection Bypass for Automation** secret from Project Settings → Deployment Protection. Note that the SSO redirect drops the query string, so a first visit to a token-gated URL lands without its token — navigate again once the session cookie is set.

## Production

Vercel production, deployed from `main`. Supabase `margin-school` in Paris (`eu-west-3`), Postgres 17.

### Database connection strings

The Supabase integration already provides these in Vercel — **do not add a duplicate `DATABASE_URL`**:

| Variable | Host | Use for |
| --- | --- | --- |
| `POSTGRES_URL` | `aws-0-eu-west-3.pooler.supabase.com` | Application queries. Pooled, which is what serverless needs |
| `POSTGRES_URL_NON_POOLING` | direct | Migrations, and anything needing prepared statements or long transactions |

Locally, `.env.local` sets `DATABASE_URL` to the Docker Postgres. When Drizzle lands, read `DATABASE_URL ?? POSTGRES_URL` so one code path covers both, and point migrations at the non-pooling URL.

## Database migrations

**Drizzle authors the schema; the Supabase CLI runs the migrations.** There is exactly one migration history, in `supabase/migrations/`.

Two migration systems in one repo is the classic Supabase + Drizzle failure — Drizzle keeps its own folder and runner, `db:reset` replays only Supabase's, and half the schema silently goes missing. Avoided by pointing `drizzle.config.ts` at `supabase/migrations/` with `migrations: { prefix: "supabase" }`, which produces the timestamped filenames the Supabase runner requires.

```bash
npm run db:generate         # schema change → SQL migration
npm run db:reset            # replay every migration from empty
supabase migration list     # compare local history against Paris
```

### Migrations deploy themselves

**A migration merged to `main` is applied to the production database automatically**, by the Supabase GitHub integration. Nobody runs `supabase db push`; by the time you think to, it has already happened.

This was discovered by testing rather than by reading — the deployed app reported `profileTableExists: true` on a database nothing had knowingly pushed to, and `supabase migration list` confirmed both migrations were already applied remotely.

Two consequences worth holding onto:

- **The pull request is the only review gate.** There is no second chance between merge and production.
- **Blast radius is larger than it looks.** Preview shares the production database ([ADR-0010](decisions/0010-no-staging-database.md)), so a destructive migration reaches production data and every preview at once. Harmless today because there is no data. Not harmless after the ADR-0010 reversal trigger.

### Rules

1. **Read every generated migration before applying it.** It gets committed and replayed forever.
2. **`drizzle-kit push` is banned.** It syncs the schema with no migration file and would silently drop the triggers, policies and grants that Drizzle does not track.
3. **Triggers, functions, RLS policies and grants are hand-written.** drizzle-kit generates tables, columns and constraints only, and does not record the rest in its snapshots. Keep them in their own migration files.
4. **Grants are not optional.** Postgres checks `GRANT` before RLS, so a policy on a table with no grant is unreachable — the request fails with "permission denied for table" and the policy never runs. Tables made in the Supabase dashboard get grants implicitly; tables made by a Drizzle migration do not.
5. Drizzle writes a `meta/` folder alongside the SQL. The Supabase runner ignores it.

## Auth email templates

**The stock Supabase email templates do not work with this app, and the failure is silent.**

`@supabase/ssr` pins `flowType: "pkce"`. Supabase's default templates link to `{{ .ConfirmationURL }}`, which resolves through Supabase's own `/verify` endpoint and returns the token in the URL **fragment** — and a fragment is never sent to the server, so a server-rendered app cannot read it. Sign-in still works, because OAuth returns a `code` in the query string. Password reset does not.

The replacements live in [`supabase/templates/`](../supabase/templates/) and send `{{ .TokenHash }}` to our own `/auth/confirm`, which calls `verifyOtp`. `config.toml` wires them for the local stack.

**Nothing syncs them to production.** `config.toml` configures the local Docker stack only; the hosted project keeps its own copies, set in the Supabase dashboard under Authentication → Emails. When deploying to a new project, paste both templates in — otherwise every "reset your password" link lands on a page that cannot see its own token.

They are bilingual (French block, then English) because Supabase sends one template per event and knows nothing about the recipient's language. Per-locale templates arrive with Resend in Phase 10.

### Rate limits are per-IP and bite the test suite

`[auth.rate_limit].sign_in_sign_ups` defaults to 30 per five minutes per IP. The e2e suite signs in on nearly every test across two viewport projects and several workers, all from one IP, and blows past that partway through — at which point sign-ins are refused and the symptom is `page.goto` timing out, which reads exactly like an application hang. It is raised to 500 in `config.toml`, which affects the local stack only; the hosted project keeps Supabase's defaults, and should.

## Observability

One Sentry project and one PostHog project, split by environment tag rather than by separate projects. This keeps issue grouping and funnel history intact while remaining filterable.

- **Sentry** — org `baziloo`, project `margin-school`, ingesting to `de.sentry.io` (EU). Every event carries `environment` and, on Vercel, `release` (the git SHA).
- **PostHog** — project `Margin-school` on EU cloud (`eu.i.posthog.com`). Every event carries `environment` as a registered super property.

Both are **off locally by default** so development noise never reaches the dashboards. To test the integration locally:

```bash
NEXT_PUBLIC_SENTRY_ENABLE_LOCAL=true NEXT_PUBLIC_POSTHOG_ENABLE_LOCAL=true npm run dev
```

### Smoke-test panel

```
/debug/observability?token=<OBSERVABILITY_DEBUG_TOKEN>
```

Buttons for a client error, a server error, and an analytics event, plus a readout of what this environment resolved to. It works in **every** environment including production — production monitoring cannot be verified from staging — and is protected by a server-only shared secret rather than an environment check. Without the token it returns 404. If the token is unset, the panel is closed: it fails shut.

The token lives in `OBSERVABILITY_DEBUG_TOKEN`, set in Vercel for both Preview and Production, and in `.env.local` for local.

### Managing Vercel environment variables

**`vercel env rm NAME development` deletes the entire variable, not just its Development target.** The `[environment]` argument does not narrow the deletion. To remove one scope from a variable that spans several, edit it in the Vercel dashboard. To remove a variable that exists only in one scope, the CLI is fine.

The Supabase integration scopes its variables to Production, Preview and Development. Every actual secret has been removed from Development — password, connection strings, JWT secret, service-role and secret keys. What remains Development-scoped is public by design (project URL, host, database name, anon/publishable keys), so it is not worth another delete-and-restore to clean up.

### Using monitoring in new code

See [observability.md](observability.md) — what we measure, the event taxonomy, and the conventions for adding more. This document covers only how the tools are wired per environment.

## Analytics consent

PostHog is **not loaded at all** until the visitor consents. It is deliberately not configured with `opt_out_capturing_by_default`, because opting out still loads the library and can still touch storage. Not loading it is unambiguous, which is what CNIL expects.

Consent lives in `localStorage` under `ms-analytics-consent`; changes broadcast on the `ms-analytics-consent-change` event. Sentry is not gated on consent — it carries no PII (`sendDefaultPii: false`) and Session Replay is off.

## Data residency

Every processor is in the EU: Supabase Paris, Sentry Germany, PostHog EU cloud, Vercel. Keep it that way — check the region before adding any new service.
