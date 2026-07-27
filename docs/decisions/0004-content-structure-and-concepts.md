# ADR-0004 — Concepts separate from course structure

**Status:** Accepted · 2026-07-27

## Context

The obvious model is one hierarchy: course → chapter → lesson, with progress stored per lesson. It is simpler and it is what most course platforms do.

But the product's differentiator is adaptivity — placement, "what to learn next", targeted review, a tutor that knows what you specifically do not understand. None of that is expressible in terms of lessons.

## Decision

Maintain **two hierarchies**:

1. **Structure** — `category → course → chapter → lesson → block[]`. What the learner navigates.
2. **Concepts** — a graph of skills with prerequisite edges. What the system reasons about.

Lessons *teach* concepts. Questions *test* concepts.

**Mastery is stored on concepts. Completion is stored on lessons.** Never mastery on a lesson.

Additionally, `question` and `card` are **first-class rows**, not payload buried inside a quiz or flashcard block.

## Consequences

- Adaptivity becomes possible rather than decorative: the system can distinguish "struggling with risk sizing" from "struggling with candlesticks" even when both were taught in the same lesson.
- Courses can be reorganised, split, merged or renamed without destroying anyone's progress, because progress does not depend on course shape.
- A placement test can skip a learner forward by asserting concept mastery directly.
- Review sessions (Phase 12) can pull questions independently of the lesson they came from — impossible if questions live inside block JSON.
- Costs: an extra join on most read paths, and the content author must tag lessons and questions with concepts. Tagging is a real ongoing burden and the admin UI must make it fast, or it will be skipped and the whole model degrades to decoration.

## Why now and not later

This is cheap in Phase 1 and a rewrite afterwards. If mastery is stored per-lesson, Phase 12 requires re-deriving concept-level history from lesson-level records that never contained it — the information simply is not there. Retrofitting means either discarding all existing learner progress or shipping adaptivity that is wrong for existing users.

## Alternatives rejected

**Single hierarchy, progress per lesson.** Simpler, ships faster, and permanently forecloses the product's differentiator.

**Tags instead of a prerequisite graph.** Tags give grouping but no ordering, so "what should I learn next" stays unanswerable.
