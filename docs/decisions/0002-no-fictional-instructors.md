# ADR-0002 — No fictional instructors or invented social proof

**Status:** Accepted · 2026-07-27

## Context

The prototype featured ten named instructors with photos, bios and specialisations, plus "144,430+ enrolled students" and course ratings. None of it is real. Content is produced in-house with AI assistance.

## Decision

**No invented people and no invented social proof, anywhere, ever.**

Prohibited: instructor names, bios, photos, credentials, testimonials, star ratings, review counts, enrolment numbers, "trusted by" logos — unless genuinely true and verifiable.

The brand teaches. If a human face is needed, it is a real person who consents.

## Consequences

- Course pages carry no instructor block. Design accordingly — this changes the layout, it is not a field left blank.
- The catalog cannot lean on ratings or enrolment counts for credibility. It must instead demonstrate depth and quality directly: real curriculum, real free previews.
- Seed and placeholder data must be **obviously** placeholder. Never generate realistic-looking fake people, even in fixtures — fixtures leak into screenshots, demos, and eventually production.
- Social proof becomes available only once real users exist, and then only with consent.

## Rationale

Invented credentialed-looking experts in a **financial** context read as deceptive to users and to regulators, and it is precisely the credibility attack that kills a young education brand. A single screenshot of a fabricated instructor is unrecoverable.

Separately: AI-assisted financial content can be confidently wrong, and a wrong number about leverage or margin calls costs someone money. Factual review before publish is a required pipeline stage, not an optional one. Fake authorship would compound that risk by implying human expert review that did not happen.

## Alternatives rejected

**Generic stock-photo instructors.** Same deception, less deniability.

**A single fictional brand persona ("Prof. Margin").** Tempting, and defensible if unmistakably a mascot — but the line between mascot and implied credential is thin in finance, and not worth defending.
