# Product

## The promise

> You arrive knowing nothing about markets. Margin School tells you exactly what to learn next, teaches it against a real chart, checks that you actually understood it, and never lets you quietly fall behind.

The product is **the path and the feedback loop** — the sequencing, the correction, and the memory of where you are. Content is raw material; the spine is what we sell.

This distinction is commercial, not philosophical. A library is worth one purchase. A spine is worth a monthly subscription, because the value is *your position in it*, which you lose if you leave.

## Who we serve

**Primary: the complete beginner.** Knows nothing, curious about markets, probably intimidated by them. Needs vocabulary, sequence, and confidence. Cannot use a catalog effectively, because they do not know what they do not know.

**Secondary, shallow for now:** the self-taught retail trader who wants structure, and the long-term investor. Present in the catalog, not yet the design target. The beginner track is the funnel into them later.

## What the subscriber receives

Eight things. Every feature should trace to one of them; if it does not, question it.

| # | Deliverable | Why it matters |
| --- | --- | --- |
| 1 | **A placement** — a diagnostic that says *you are here* | Beginners cannot self-assess. A catalog paralyses them |
| 2 | **A next action** — "do this now, it takes 8 minutes" | The single highest-value screen for a beginner |
| 3 | **A lesson** — one idea, explained, shown on a real chart, then checked | The atomic unit |
| 4 | **A tutor that knows where you are** | Knows the lesson, the chart, your level, what you got wrong last week |
| 5 | **Correction** — graded exercises that explain *why* you were wrong | Being wrong safely is the mechanism of learning |
| 6 | **Memory** — spaced repetition and review | Week-1 knowledge must survive to week 6. Also a weekly reason to return |
| 7 | **Practice without risk** — simulated portfolio | The bridge from *understood* to *can do*. Open positions are the strongest retention hook in this category |
| 8 | **Proof** — progress, mastery, streaks, certificates | What you show yourself and other people |

**Items 2, 4, 6 and 7 are the defensible ones.** A competitor can clone 1, 3, 5 and 8 by generating more content. Roadmap weight belongs on the defensible four.

## Why this shape

Content is AI-assisted, which means a library of courses is not defensible — its marginal cost approaches zero for everyone, including the subscriber, who has a chatbot. What a chatbot cannot provide is sequence, progress, correction, and refusing to move on when you did not understand. That is the product.

Two consequences that are easy to get wrong:

- **No fictional instructors.** Invented credentialed-looking experts in a financial context read as deceptive to users and regulators, and it is the exact credibility attack that kills a young education brand. The brand teaches. See [ADR-0002](decisions/0002-no-fictional-instructors.md).
- **Factual QA is load-bearing, not a nice-to-have.** A wrong number about leverage or margin calls costs someone money. Review before publish is a required pipeline stage, not an optional one.

## The three modules

| Module | Serves | Its one job | Success measure |
| --- | --- | --- | --- |
| **Catalog** (public) | Visitors who have never heard of us | Make the library feel deep and the path feel obvious, then convert to trial. It is a *showcase and acquisition surface*, not a storefront | Visit → trial start |
| **Study** (private) | Subscribers | Deliver the eight deliverables, weekly | Weekly active, month-2 retention |
| **Admin** (internal) | The content team | Get a lesson from idea → fact-checked → published, without a developer | **Lessons published per week** |

The admin measure is the one usually forgotten. Its real KPI is the content author's throughput. If publishing a lesson takes 40 minutes of fighting a CMS, the platform fails no matter how good the study area is.

## Economics

Subscription, all-access, no per-course sales. The economic unit is **retention**, not conversion. Nobody churns off a course they already bought; everybody can churn off a subscription every month. This is why deliverables 6 and 7 (memory, practice) carry more weight than they would on a marketplace.

Catalog depth must therefore visibly grow. "What is new this month?" needs a real answer.

## Acquisition

SEO and AI-search are the primary channel — there is no ad budget, and content is cheap to produce. This makes the public catalog a **marketing system**, which is why free preview content and indexability are product decisions, not afterthoughts.

## Explicit non-goals

Not building, and not designing for: shopping cart, per-course purchase, coupons, external instructors, revenue share, payouts, content moderation queues, affiliate programs, community/forum, mobile apps, live market data (until much later), video pipeline (until much later), certificates of accreditation, or anything resembling investment advice.

## Compliance posture

Educational content only. Never advice, never signals, never recommendations to buy or sell. Risk disclaimers are required surface. EU/French audience means GDPR: EU data residency, CNIL-compliant consent gating analytics before it loads.
