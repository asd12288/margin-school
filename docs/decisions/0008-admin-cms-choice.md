# ADR-0008 — Admin authoring: Payload CMS vs custom build

**Status:** 🟡 **Open** · raised 2026-07-27 · **must be decided before Phase 7**

Does not block Phases 0–6. It does constrain them: keep content access behind a repository layer so either outcome remains cheap.

## Context

The admin was initially scoped as "a simple content manager". It is not simple. It needs:

- Typed content blocks with a usable editing experience
- **Per-locale draft / review / publish** ([ADR-0009](0009-french-english-day-one.md))
- Versioning and preview-as-student
- Media upload, categories, ordering, bulk operations
- A UI a non-technical content author uses every day

That is the largest hand-built component in the plan, and its KPI is the author's throughput — minutes to publish a lesson.

## Options

**A — Payload CMS.** Runs inside the Next app, uses our Postgres, block schemas defined in TypeScript. Localisation and drafts/versions are first-class — precisely the two most expensive pieces. Gives the author a real admin UI essentially for free.

*Risks:* Next 16 compatibility must be verified before committing — do not assume it. Payload owns part of the schema, so the boundary with our own tables needs to be explicit. It is opinionated, and fighting an opinionated tool is worse than writing the code.

**B — Custom admin.** Full control over the authoring experience, which matters because throughput is the KPI and generic CMS UIs are rarely fast for a specific content shape. Costs roughly a month of the schedule and re-solves localisation, versioning and drafts — all of which are more subtle than they look.

**C — Hybrid.** Payload for content, our own Drizzle schema for user data, joined at the application layer.

## Leaning

**C, contingent on Payload supporting Next 16.** It buys the expensive generic machinery while leaving progress, mastery and subscriptions entirely ours.

Regardless of outcome, hold the boundary from [stack.md](../stack.md): **content is read-mostly, published and cacheable; user data is transactional and ours.** That separation is what makes the CMS replaceable later without touching a single user record.

## To decide it

1. Verify Payload's Next 16.2 compatibility — actually run it, do not read the changelog.
2. Model one real lesson from [content-model.md](../content-model.md) in Payload, including a chart block, FR published and EN draft.
3. Time the author publishing that lesson. If it exceeds roughly ten minutes, the generic UI is not paying for itself.
