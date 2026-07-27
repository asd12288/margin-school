# ADR-0001 — Subscription-only, single publisher

**Status:** Accepted · 2026-07-27

## Context

An earlier PHP prototype was built as a marketplace: per-course prices (€29.99–79.99), a shopping cart, multi-currency, ten instructor profiles, and a "become an instructor" funnel. That prototype does not reflect the business.

## Decision

Margin School is a **single-publisher subscription**. One all-access plan. We produce all content.

Consequently the following do not exist and must not be built:

- Shopping cart, checkout per course, per-course pricing, coupons, discount timers, per-course refunds
- Instructor onboarding, creator studio, revenue share, payouts, content moderation queue
- Multi-currency pricing display tied to per-course purchase

## Consequences

- **The catalog is a showcase, not a storefront.** Its job is convincing a visitor the library is worth a monthly fee, not selling one item.
- **The economic unit changes from conversion to retention.** Nobody churns off a course they already bought; everybody can churn off a subscription monthly. Features that drive return visits — review sessions, practice, new content — outrank features that drive a single purchase.
- **Catalog depth must visibly grow.** "What is new this month?" needs a real answer.
- **Admin becomes an internal content studio**, not a moderation tool. Its KPI is the content author's throughput.
- Udemy remains useful for information architecture and useless for commerce patterns.

## Alternatives rejected

**Marketplace from day one.** Requires a creator studio, revenue-share accounting, Stripe Connect payouts, tax handling for sellers, and a review pipeline. Enormous build, and supply quality becomes unmanageable when the differentiator is a uniform AI-guided study experience.

**Hybrid with invited instructors.** Deferrable. Nothing in the current architecture prevents adding it later; nothing about it is needed now.
