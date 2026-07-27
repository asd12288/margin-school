# ADR-0009 — French and English from day one

**Status:** Accepted · 2026-07-27

## Context

The prototype offered FR, EN and ES. Whether content is single- or multi-locale is a schema decision, and retrofitting translations onto a single-language schema is one of the most expensive mistakes available in a content platform — it touches every table, every URL, every query and every admin screen at once.

## Decision

Launch with **French and English**. Design the model to accept further locales without migration. Spanish is not a launch locale.

Mechanics are specified in [content-model.md](../content-model.md). The load-bearing choices:

- Translations are **rows**, not JSONB locale maps.
- **Publish status is per locale.** A lesson is routinely published in FR and draft in EN.
- Locale-invariant data (chart symbol, timeframe, ordering, free-preview flag) lives on the parent row and is never duplicated per locale.
- Locale in the URL (`/fr/...`, `/en/...`) with correct `hreflang`.
- UI strings (next-intl) and content translations (database) are separate systems and never mixed.

## Consequences

- **Content workload roughly doubles.** Whether English is a translation of French or its own editorial line is an open editorial question, not a technical one — but it must be agreed before serious authoring begins.
- Every content read path must handle a missing translation. This is a **product state** — "not yet available in this language" — with real design, not an error.
- The admin needs a locale switcher and per-locale status on every editable entity from Phase 7.
- SEO is doubled and must be done correctly: hreflang, per-locale sitemaps, per-locale slugs. Since search is the primary acquisition channel, cookie-based locale switching is not acceptable.

## Alternatives rejected

**French only, English later.** Cheaper now; the retrofit later touches everything at once and lands precisely when there is the most content to migrate by hand.

**All three prototype locales at launch.** Triples content workload before there is evidence anyone wants any of it.
