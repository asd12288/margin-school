# ADR-0007 — Stripe direct, not a merchant of record

**Status:** Accepted · 2026-07-27

## Context

A B2C digital subscription sold across the EU triggers VAT obligations in the customer's country. Two ways to handle it:

- **Stripe direct** — we are the merchant. We register for VAT (OSS), charge the correct rate per country, issue compliant invoices, and file returns. Stripe Tax calculates and collects but does not relieve the obligation.
- **Merchant of record** (Paddle, Lemon Squeezy, Polar) — the provider is the seller of record and owns the VAT problem entirely. Roughly 5% versus roughly 2.9%.

## Decision

**Stripe direct**, with Stripe Tax and the Stripe Customer Portal.

## Consequences

- We take on EU VAT registration (OSS), invoicing compliance and periodic filing. This is real recurring administrative work and needs an owner — assume an accountant.
- Roughly 2% more revenue retained than a merchant of record.
- Full control over subscription mechanics: trials, proration, pausing, grandfathered pricing, coupons at the *plan* level.
- Stripe Customer Portal covers billing self-service — payment method, invoices, cancellation — which removes a meaningful chunk of account UI from Phase 10.
- Behind the [ADR-0006](0006-entitlement-boundary-before-billing.md) boundary, so switching to a merchant of record later means writing one adapter, not rewriting access control.

## Alternatives rejected

**Merchant of record.** Genuinely attractive for a solo founder — it removes VAT registration, filing and invoicing compliance outright, which is the single most under-considered decision on a solo EU SaaS. Rejected for margin and control. Worth revisiting if VAT administration proves more burdensome than expected; the boundary in ADR-0006 keeps that door open.
