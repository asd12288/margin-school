# ADR-0010 — Preview shares the production database, for now

**Status:** Accepted · 2026-07-27 · **time-boxed, see Reversal trigger**

## Context

The Supabase Vercel integration scopes its variables to Production, Preview and Development, so preview deployments read and write the production database.

The clean fix is a separate Supabase staging project. On the current plan that is roughly $10/month, and it is a fourth project to keep in sync — migrations, seed data, keys.

Today the production database has **no schema and no user data**. There is nothing to protect.

## Decision

**No staging project.** Preview shares the production database until the reversal trigger below.

## Consequences

- One less project, one less set of migrations and keys to keep aligned. Preview genuinely tests against production-shaped infrastructure.
- **A preview deployment can write to production data.** Right now that means writing to an empty database. Later it means a branch in progress corrupting real learner progress.
- `vercel env pull` gives production credentials on a laptop. This is why [docs/environments.md](../environments.md) forbids it for daily development and why local runs entirely on Docker.
- Destructive migrations are the sharpest edge: a migration run from a preview branch hits production directly.

## Reversal trigger

Create the staging project **before the first real user data exists** — concretely, before either:

1. the first non-team account is created, or
2. the content author begins authoring against the production database rather than local.

Whichever comes first. This is not a "revisit someday" item; it is a prerequisite for going live, and the cost of doing it late is measured in lost user data rather than dollars.

## Alternatives rejected

**Staging project now.** Correct, and premature. Real money and real maintenance to protect an empty database.

**Preview with no database at all.** Would make preview deploys fail on anything touching data, which defeats the point of previews.
