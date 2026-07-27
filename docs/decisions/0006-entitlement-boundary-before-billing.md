# ADR-0006 — Entitlement boundary before billing

**Status:** Accepted · 2026-07-27

## Context

Payment was originally slated for the foundations phase. Building the full billing system that early means webhooks, proration, dunning, invoicing and EU VAT all sitting idle for months while plans, trial length and pricing change several times — and while there is nothing worth paying for yet.

Building it late risks the opposite: access checks scattered inline through the catalog and study area, then retrofitted.

## Decision

Split payment into two parts, built at different times.

**Phase 5 — the boundary.** One function:

```
canAccess(user, resource) → boolean
```

backed by a subscription status field on the user, set by a dev-only toggle. No payment provider present.

**Phase 10 — the provider.** Stripe wired behind that same boundary, plus Stripe Tax, Customer Portal, webhooks, trial and dunning.

**Every gate in the product calls `canAccess` and nothing else.** No inline subscription checks, ever.

## Consequences

- Locked states, free previews and paywalls can be designed and built from Phase 5, long before billing exists — and the locked state is a screen a subscription product shows constantly, so it deserves the extra design time.
- Testing access control needs no Stripe fixtures and no network.
- Switching or adding a provider later touches one adapter.
- The dev-only toggle is a genuine security risk if it reaches production. It must be gated by environment and covered by a test that fails if it is reachable in production.

## Alternatives rejected

**Full Stripe integration in foundations.** Weeks of work rotting while product decisions change under it, and no revenue to justify it.

**Defer entitlement entirely until Phase 10.** Guarantees inline access checks spread through catalog and study code, then a painful retrofit at exactly the moment when correctness matters most — because by then, getting it wrong means either giving content away or locking out paying users.
