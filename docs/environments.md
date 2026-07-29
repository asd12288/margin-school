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

## Continuous integration

[.github/workflows/ci.yml](../.github/workflows/ci.yml) runs on every pull request into `main` and on `main` itself. Two jobs, in parallel:

| Job | Runs | Needs env |
| --- | --- | --- |
| **Lint, types and unit tests** | `npm run lint` · `npx tsc --noEmit` · `npm run test` | No |
| **Production build** | `npm run build` | Placeholders only |

**The build job is the point.** Cache Components and `unstable_instant` are the two constraints in [ux-architecture.md](ux-architecture.md) that fail at *build* time and nowhere else — a route that quietly stopped prerendering, or an uncached `cookies()` read outside a `<Suspense>` boundary, is invisible to lint, types and the unit suite alike. It surfaces here or it surfaces in production.

**Its environment variables are placeholders and nothing connects to them.** `DATABASE_URL` exists because [lib/db/client.ts](../lib/db/client.ts) throws at module scope without it, and `postgres()` connects lazily; the Supabase pair exists because `createServerClient` throws immediately on an undefined URL, and prerendering `/courses` reaches it through `getCurrentProfile()`. With no session cookie the auth call fails, `getCurrentUser()` returns `null`, and no query is made. **Never put real credentials here** — CI has no reason to reach any environment, and a workflow file is public.

`NEXT_PUBLIC_APP_ENV` is deliberately unset, so `lib/env.ts` resolves `local` — the value under which the most routes actually render. `production` would make `/debug/subscription` 404 at build time and quietly stop covering it.

**The Playwright suite is not in CI.** It needs the Supabase Docker stack, the seed script and a production build to serve, which is a much slower job than these two; bolting it on is how a suite becomes something people learn to ignore. Run it locally with `npm run test:e2e` before anything that touches auth or routing.

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

**This repo owns production's templates.** An earlier version of this document said the opposite — that `config.toml` was local-only and nothing synced the templates — and that was wrong. `[auth.email.template.*]` is not restated under `[remotes.production.auth.email]`, so it is inherited, and a config push sends both subjects and both rendered bodies. Verified by capturing the actual push payload.

The consequence runs both ways, and both are easy to get wrong: editing a template in the Supabase dashboard buys you nothing, because the next push to `main` replaces it; and editing `supabase/templates/*.html` *does* change production, whether or not you meant it to. Edit them here.

The link is built on `{{ .RedirectTo }}`, **not** `{{ .SiteURL }}`. `SiteURL` is one value per Supabase project, and preview deployments share production's ([ADR-0010](decisions/0010-no-staging-database.md)) — so a reset requested on a preview would mail a link to production. `RedirectTo` is what the app passed in, with the origin read off the request, so the link returns to whichever deployment sent it. Locally it was pinning every link to port 3000 regardless of where the app was running, which is how the e2e suite on 3100 caught it.

They are bilingual (French block, then English) because Supabase sends one template per event and knows nothing about the recipient's language. Per-locale templates arrive with Resend in Phase 10.

### Rate limits are per-IP and bite the test suite

`[auth.rate_limit].sign_in_sign_ups` defaults to 30 per five minutes per IP. The e2e suite signs in on nearly every test across two viewport projects and several workers, all from one IP, and blows past that partway through — at which point sign-ins are refused and the symptom is `page.goto` timing out, which reads exactly like an application hang. It is raised to 500 in `config.toml`, which affects the local stack only; the hosted project keeps Supabase's defaults, and should.

**`email_sent` is the exception, and it is not a setting.** The CLI only puts `rate_limit_email_sent` in a push payload when `[auth.email.smtp]` is enabled, and ours is commented out — so `[remotes.production.auth.rate_limit].email_sent = 2` is never sent and the hosted project keeps its own limit. It happens to be 2/hour regardless, because that is the cap on Supabase's built-in sender. The line is kept as a statement of intent and the comment above it says so; wiring up SMTP (Resend, Phase 10) is what makes it real, and is the moment to re-decide the number.

### What a push actually overwrites, and what it leaves alone

Two different rules, and the difference is invisible unless you go looking:

| Block | On a push | Why |
| --- | --- | --- |
| `[auth.mfa]` | **always sent** | every `mfa_*` field is assigned unconditionally, so the local values *are* production's |
| `[auth.captcha]` | **never sent** | the whole block is guarded by "is it defined", and ours is commented out |

So MFA off in production is inherited rather than chosen — and it is nonetheless right, because there is no enrolment screen and nothing that answers an AAL2 challenge at sign-in. Enabling TOTP enrolment would let someone enrol a factor through the API that the app cannot challenge, locking them out. It changes when MFA is built, together with the sign-in flow. Uncommenting `[auth.captcha]`, by contrast, starts overwriting production on the next push to `main`.

### Password changes require a recent sign-in

`[auth.email].secure_password_change` is **on, in the base block**, so the local stack and the e2e suite run against the same rule production does. A rule that is only on in production is one nothing tests.

GoTrue rejects a password update with `reauthentication_needed` unless the session signed in within the last 24 hours (or the caller supplies an emailed nonce). Session age is `auth.sessions.created_at` — the sign-in time, which does **not** move when the token refreshes, so anyone who signed in yesterday and stayed signed in is past it.

Both flows stay inside the window by construction: recovery gets a session seconds old from `verifyOtp`, and `changePasswordAction` re-signs-in to check the current password, which mints one. That last part is why the check runs on the cookie-bound client rather than a throwaway one — the session rotation is the point, not a side effect. Turning it back into a session-less check re-breaks the account form for every visitor older than a day.

What the flag buys over the app's own check is the case no form of ours can see: a stolen access token calling `PUT /auth/v1/user` directly.

## Google sign-in

**One Google Cloud OAuth client serves all three environments.** This surprises people, so it is worth stating plainly: Google never sees this app's URL. It sees Supabase's. Our `/auth/callback` is the second hop, reached only after Supabase has already finished with Google.

So the client carries exactly two authorised redirect URIs:

| URI | Covers |
| --- | --- |
| `http://127.0.0.1:54321/auth/v1/callback` | Local Docker stack |
| `https://zmwguudoqgygawysniki.supabase.co/auth/v1/callback` | **Preview and production** |

Preview needs no entry of its own because it shares production's Supabase project ([ADR-0010](decisions/0010-no-staging-database.md)). Per-deployment preview hostnames never reach Google — they are handled by Supabase's own redirect allowlist, which is what `additional_redirect_urls` in `[remotes.production.auth]` is for. **The day ADR-0010 is reversed and preview gets its own Supabase project, that project's callback needs a third URI here**, or Google sign-in breaks on preview only.

- Google Cloud project `margin-school`, client **"Supabase Auth (local + preview + production)"**.
- Publishing status is **In production**, user type **External**. In `Testing` only manually-listed test users can sign in *and refresh tokens expire after seven days* — which looks like random sign-outs rather than a configuration choice. Publishing needed no Google review because the app requests only basic scopes (email, profile, openid); adding a sensitive scope later would trigger verification.

### Where the credentials live

**Not in Vercel.** The app process never handles them — Supabase does the token exchange. Vercel holds only `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED`, a boolean that decides whether the button is drawn (set for Production and Preview).

| Where | Holds | Why there |
| --- | --- | --- |
| `supabase/config.toml` | the client id, as a literal | public, and must survive a push from a machine with no secrets |
| `.env.local` | the secret | local stack only; read by `config.toml` at `supabase start` |
| Hosted Supabase project | the secret | set once, directly on the project; never overwritten by a push |
| Vercel (Production + Preview) | `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true` | draws the button, nothing more |

Note the asymmetry: the client id is committed and the secret is not in the repo at all. Note also what is *absent* — no Google credential is stored in Vercel, because the app process never performs the token exchange. Supabase does.

### The client id is committed, and that is the fix

**The Supabase GitHub integration re-applies `config.toml` to the production project on every push to `main`** — from Supabase's own executor, which clones the repo and has no `.env.local`. It does not fail on an unresolved `env(...)`; it pushes the reference **as a literal string**.

That is not hypothetical. `client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"` was merged, the integration wrote those seven words as the client id, and Google answered `401: invalid_client` on production and preview. The integration's run was green — pushing a nonsense client id is not an error, it is just a push. It was caught by clicking the button.

So the client id is a plain literal in `config.toml`. It is public — it travels in every authorize URL — so committing it discloses nothing, and being a literal is what makes it survive a push from a machine that holds no secrets.

The secret cannot take the same treatment, so it takes the opposite one: `secret = ""` in the production block. An empty value is **omitted** from the push rather than sent as `""`, which leaves the secret already set on the Supabase project untouched. That is the only way a public file can describe a private value — by saying nothing about it. [`tests/unit/supabase-config.test.ts`](../tests/unit/supabase-config.test.ts) fails if either rule is broken.

To push config by hand:

```bash
supabase config push --project-ref zmwguudoqgygawysniki
```

No `source .env.local` prefix is needed — the CLI loads `.env.local` from the working directory on its own. It prints a full diff and prompts before applying; read it.

Google will not show you an existing client secret — it is displayed once, at creation. If it is lost, add a new secret on the client, put it in your `.env.local`, and set it on the Supabase project directly. The old secret keeps working until you delete it, so there is no downtime.

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
