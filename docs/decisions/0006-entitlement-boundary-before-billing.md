# ADR-0006 — Entitlement boundary before billing

**Status:** Accepted · 2026-07-27 · amended 2026-07-29 (return type)

## Context

Payment was originally slated for the foundations phase. Building the full billing system that early means webhooks, proration, dunning, invoicing and EU VAT all sitting idle for months while plans, trial length and pricing change several times — and while there is nothing worth paying for yet.

Building it late risks the opposite: access checks scattered inline through the catalog and study area, then retrofitted.

## Decision

Split payment into two parts, built at different times.

**Phase 5 — the boundary.** One function:

```
canAccess(viewer, resource) → AccessDecision
```

backed by a subscription status field on the user, set by a dev-only toggle. No payment provider present.

**Amended 2026-07-29: it returns a decision, not a `boolean`.** As originally written this ADR said `→ boolean`, and building it that way defeated the rule three paragraphs down. There are two reasons a learner cannot open something — `requires-subscription` and `requires-prerequisite` — and they are different problems: one means "pay", the other means "not yet". A boolean discards the difference at exactly the point it was decided, so every caller has to recover it by branching on subscription status itself, which is the inline check this ADR exists to forbid.

```ts
type AccessDenial = "requires-subscription" | "requires-prerequisite";
type AccessDecision = { allowed: true } | { allowed: false; reason: AccessDenial };
```

Only the return type widens. One boundary, no inline checks, is unchanged.

**Which statuses entitle is decided in that function, not in a webhook.** `active`, `trialing` and `past_due` grant access; `none` and `canceled` do not. `past_due` is the one worth stating out loud: dunning retries over days, and cutting a paying customer off when the first retry fails converts a recoverable payment into a cancellation. It is a product decision, so Phase 10 gets to report Stripe's events and not to redefine who is entitled.

See [lib/entitlement/can-access.ts](../../lib/entitlement/can-access.ts).

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
