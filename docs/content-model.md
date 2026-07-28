# Content model

**This is the contract.** The content author writes against it and their work cannot be migrated by machine if it is wrong. Change it deliberately, early, and never casually once authoring has begun.

## Two hierarchies, not one

### Structure — what the learner navigates

```
category → course → chapter → lesson → block[]
```

### Concepts — what the system reasons about

A separate graph of skills (`candlestick-anatomy`, `risk-per-trade`, `leverage`, `support-resistance`) with prerequisite edges between them.

- A lesson **teaches** one or more concepts.
- A question **tests** one or more concepts.

**Mastery lives on concepts. Completion lives on lessons.** This single separation is what makes adaptivity real rather than decorative — it is what lets the tutor say "you are struggling with risk sizing, not with candlesticks", what lets review sessions schedule the right material, what lets a placement test skip someone forward, and what lets courses be reorganised later without destroying anyone's progress.

If mastery is ever stored per-lesson, Phase 12 becomes a rewrite and the catalog can never be restructured. See [ADR-0004](decisions/0004-content-structure-and-concepts.md).

## Entities

### Content domain — read-mostly, cacheable, translatable

| Entity | Notes |
| --- | --- |
| `category` | Two levels: group → subcategory |
| `course` | Belongs to a category. Has level, estimated duration, ordering |
| `chapter` | Belongs to a course. Ordered |
| `lesson` | Belongs to a chapter. Ordered. Carries `is_free_preview` |
| `block` | Belongs to a lesson. Ordered. Typed. Carries locale-invariant data |
| `question` | **First-class**, not buried inside a quiz block |
| `card` | Flashcard. **First-class**, same reason |
| `concept` | The skill graph node |
| `concept_prerequisite` | Directed edge, concept → concept |
| `lesson_concept` | Which concepts a lesson teaches |
| `question_concept` | Which concepts a question tests |

**Why questions and cards are first-class rows rather than JSON inside a block:** Phase 12 review sessions need to pull questions independently of the lesson they came from. If a question only exists inside a lesson's block payload, spaced repetition cannot address it, and per-question difficulty statistics are impossible. This costs nothing now and is expensive to retrofit.

### User domain — transactional, never cached, never public

| Entity | Notes |
| --- | --- |
| `course_enrollment` | Started/last-touched. Not a purchase — access is all-access |
| `lesson_progress` | Completion and resume position only. **No mastery here** |
| `concept_mastery` | Score, `last_reviewed_at`, `next_review_at` (drives Phase 12) |
| `question_attempt` | Per attempt, for grading history and difficulty stats |
| `favorite` | User → course |
| `note` | User → lesson |
| `subscription` | Status, provider ids, period end. Read only via the entitlement boundary. **Not built yet** — see below |

Both domains live in the same Postgres. The separation is logical and strictly enforced: **never join content and user data inside a cached function.**

### What is actually built today

Only `profile` — id, role, locale, `subscription_status`, timestamps. Everything else in the tables above is design, not schema.

`subscription_status` starts as a **column on `profile`** rather than the `subscription` table described above, because today there is no subscription *object*, only a status. The table arrives in Phase 10 with the Stripe fields that justify it. Same reasoning that keeps the content tables unbuilt: no table before it has a consumer.

The content tables land once there is UI rendering a lesson, so the model gets shaped by something real rather than by imagination. Until then this document is the design; build components against fixtures in this shape.

## Blocks

A lesson is an ordered list of typed blocks. Storage is one **row per block**, not one JSON document per lesson.

*Why rows:* explicit ordering, per-block translation, per-block reuse, and the ability to query "every lesson containing a chart block" — which matters for content maintenance and stale-content detection.

### Types (v1)

`heading` · `text` · `image` · `callout` · `example` · `chart` · `quiz` · `flashcards` · `exercise` · `resource`

`video` is reserved but not implemented — see [roadmap.md](roadmap.md).

Each block row carries a `schema_version`. Block payloads will change shape; versioning lets old content keep rendering while new content uses a newer shape.

### A heading block's `level` is depth, not a tag

`level: 2` is a section of the lesson body; `level: 3` is a subsection. Neither names an HTML element.

*Why:* the lesson's title is not a block — it lives on the lesson row and the player renders it as the page's `h1`. So a `level: 2` block is an `h2` **there**, and something deeper wherever a lesson is embedded below another heading. The renderer takes the base level from its caller and derives the rest; a block that hardcoded `h2` would produce a flat or skipped hierarchy the moment a lesson appeared anywhere but at the top of a page, which is what it did on `/design-system` until it was fixed.

**A lesson's first block should not repeat its title.** The reader has already seen it. Start with a section heading that says what this part covers, or with the text itself.

### The chart block is data, never an image

```
{ symbol, timeframe, range, annotations[] }
```

*Why:* annotation labels must be translatable, wrong data must be fixable without re-exporting an asset, and the same block can later be upgraded from cached historical data to live market data without touching content. An image block would freeze all three.

## Localisation

**Translations are rows, not JSON columns.** Every translatable entity has a companion `*_translation` table keyed by `(entity_id, locale)`.

*Why rows:* per-locale publish status, per-locale slugs, proper indexing, and the ability to list "all published EN lessons" as a normal query. A JSONB locale map makes every one of those awkward.

### Rules

1. **Publish status is per locale**, not per entity: `draft` · `in_review` · `published` · `archived`. A lesson will routinely be published in FR and draft in EN. Every read path must handle this — it is the detail that bites hardest.
2. **Locale-invariant data lives on the parent row** (chart symbol, timeframe, block ordering, `is_free_preview`). Only human-readable text is translated. A chart spec is never duplicated per locale.
3. **Slugs are per locale**, unique within a locale, and never reused after retirement. IDs are stable; slugs may change, with redirects.
4. **URLs carry the locale** (`/fr/...`, `/en/...`) with correct `hreflang`. SEO is the acquisition channel, so cookie-based locale switching is not acceptable.
5. **UI strings and content translations are different problems.** UI labels go through next-intl; content translations live in these tables. Never mix them.
6. A missing translation is a **product state, not an error**. The catalog must degrade gracefully — show the course, mark the lesson unavailable in this language, offer the other locale.

Launch locales: **FR and EN**. The model accepts more without migration.

## Worked example

The prototype's demo lesson — "Anatomie d'une bougie japonaise" — decomposes as:

| Block | Type | Notes |
| --- | --- | --- |
| 1 | `heading` | Translatable |
| 2 | `text` | Concept explanation |
| 3 | `chart` | `EURUSD`, `1D`, with annotations on one candle. Symbol/timeframe invariant, labels translated |
| 4 | `text` | Open / High / Low / Close definitions |
| 5 | `quiz` | References 3 `question` rows |
| 6 | `exercise` | Guided identification |
| 7 | `flashcards` | References 12 `card` rows |
| 8 | `resource` | PDF summary |

The lesson **teaches** `candlestick-anatomy`, which has `chart-basics` as a prerequisite. The quiz questions **test** `candlestick-anatomy`. Completing the lesson writes `lesson_progress`; answering the questions writes `question_attempt` and updates `concept_mastery`.

## Invariants

- Ordering uses an explicit integer `position`, never array index or `created_at`.
- IDs are stable and never recycled.
- Published content is versioned; editing a published lesson creates a new version rather than mutating history.
- Publishing invalidates caches by tag. Nothing content-related is cached without a tag.
- `is_free_preview` is the only free/paid switch. Access is decided by the entitlement boundary, never by a check inline in a page.
