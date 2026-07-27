# Observability

What we measure, why, and the rules for adding more. For how the tools are wired per environment, see [environments.md](environments.md).

## Division of labour

| | Sentry | PostHog |
| --- | --- | --- |
| Answers | **Is it broken?** | **Is it working?** |
| Unit | An error, a slow request | A person, a behaviour |
| Read | Reactively, when alerted | Deliberately, when deciding what to build |

The two products overlap — PostHog has error tracking, Sentry has product features. **Ignore the overlap.** One question, one home: errors to Sentry, behaviour to PostHog. Splitting errors across both ends with nobody checking either.

## The principle that matters most

> **Analytics is for decisions. The database is for truth.**

- **Never report revenue from PostHog.** Revenue truth is Stripe plus our own `subscription` table. PostHog structurally undercounts, because anyone who declines consent is invisible to it — and in a French consumer product a meaningful share will decline.
- **Never gate product logic on an analytics event.** If entitlement depended on `subscription_started` having fired, an ad blocker would be a free subscription.
- PostHog tells us which of two designs converts better. The database tells us how many people paid. Different jobs, different sources.

## What exists today

**Sentry** — one project (`baziloo/margin-school`, EU/Germany), client + server + edge, split by `environment` tag rather than by separate projects so issue grouping survives across environments. `release` is the git SHA, so every error is attributable to a deploy. Traces sampled at 10% in production, 100% elsewhere. `sendDefaultPii: false`. `onRequestError` catches errors Next would otherwise swallow inside its own error boundaries. Source maps upload at build time.

**PostHog** — project `Margin-school` on EU cloud, loaded **only after consent**, `environment` and `release` registered as super properties, manual pageview capture (the App Router navigates client-side, which automatic capture would miss), `person_profiles: identified_only`.

Verify either in any environment via the smoke panel — see [environments.md](environments.md).

## Conventions for new code

- **Never call `posthog.capture` directly.** Use `capture()` from [`lib/analytics/posthog.ts`](../lib/analytics/posthog.ts). It no-ops safely when analytics is not running and never throws — a failed analytics call must not break a user flow.
- **Instrument outcomes, not clicks.** `lesson_completed`, never `button_clicked`. If an event cannot finish the sentence *"we would change the product if this number moved"*, do not send it.
- **Event names are `snake_case`, past tense, verb phrases.** `lesson_completed`, `quiz_answered`, `subscription_cancelled`. Property names are `snake_case` too.
- **Never put personal data in properties.** No emails, no names, no free text a learner typed. IDs only.
- **Do not set `environment` or `release` per event** — they are registered globally and would only drift.
- **Server errors are captured automatically** by `onRequestError`. Call `Sentry.captureException` only for errors you deliberately caught and handled but still want visibility on. Prefer `Sentry.setContext` / `setTag` over a second capture call.
- **Add a flow's events in the same change as the flow.** Retrofitting instrumentation leaves a gap in the funnel exactly where the data was needed.
- **One event registry.** From Phase 8, event names live in a single typed union so `lesson_completed` cannot drift into `lessonCompleted` elsewhere. Analytics data rots through naming drift faster than anything else, and it cannot be fixed retroactively.

## The north-star funnel

```
visit → signup → first lesson completed → 3 lessons in week 1 → active in week 4 → subscribed
```

**The activation hypothesis is step four: three lessons completed in the first week.** In education products the activation metric is almost always "completed N units early", and it predicts retention better than anything else available. Instrument it with the very first lesson that ships — it cannot be reconstructed retroactively.

Because the business is a subscription, the economic unit is **retention**, not conversion ([ADR-0001](decisions/0001-subscription-only-single-publisher.md)). Month-2 retention and weekly active learners outrank signup counts.

## Event taxonomy

Events mirror the learner journey, not the UI.

| Stage | Events | Lands in |
| --- | --- | --- |
| Acquisition | `course_viewed` · `preview_started` · `signup_completed` | Phase 8 |
| Activation | `lesson_started` · `lesson_completed` · `quiz_answered` | Phase 9 |
| Habit | `review_session_started` · `concept_mastered` | Phase 12 |
| Revenue | `trial_started` · `subscription_started` · `subscription_cancelled` | Phase 10 |
| AI | `tutor_question_asked` · `explain_differently_used` | Phase 11 |

`quiz_answered` carries whether the answer was correct and which concepts it tested — that is what makes per-concept difficulty analysis possible later ([ADR-0004](decisions/0004-content-structure-and-concepts.md)).

## What gets added, and when

Nothing below is needed yet. This is the shape so each phase knows what it owes.

| Phase | Addition | Why |
| --- | --- | --- |
| 4 — Auth | `posthog.identify(userId)` | Until this exists every session is a stranger and retention is unmeasurable. The single biggest unlock |
| 4 — Auth | `Sentry.setUser({ id })` — **id only, never email** | Turns "this error happened 40 times" into "this error hit 40 people". Different urgency |
| 8 — Catalog | Feature flags as a **deployment tool** | Ship unfinished modules dark and enable per environment, instead of maintaining long-lived branches |
| 9 — Study | Session replay | Watch a learner get stuck rather than guess. Records the DOM of a logged-in person, so it needs its own consent decision first — this is why it is off in Sentry today |
| 10 — Billing | **Sentry alerts** | Currently none exist. Minimum: new issue in production, and error-rate spike |
| 10 — Billing | Release health | Crash-free session rate per deploy makes a bad release obvious in minutes |
| 11 — AI | Tracing on the tutor route | Every call is a cost and a latency risk |
| 12 — Journey | Sentry cron monitors | A scheduler that silently stops running is the classic invisible failure. Monitors catch "it did not run", which nothing else does |
| 12 — Journey | Experiments | Only meaningful once there are enough learners and a completion metric worth moving |

## Two things worth doing early

**Link the tools.** Attach the PostHog session ID to Sentry events, so an error report links straight to a replay of the session that caused it. Roughly ten lines, and it turns "someone says it broke" from an hour of guessing into a minute. Do it as soon as session replay is on.

**Alerts before dashboards.** A dashboard is for a question you already have; an alert finds the problem you do not know about. Build the alert first.

## Cost shape

Both free tiers are generous and we will be inside them for a long time. The two things that burn quota are **session replay** (PostHog) and **traces** (Sentry) — traces are already sampled to 10% in production, replay is off. Sample replay when enabling it; 100% replay on a study product gets expensive fast. Errors stay at 100%: they are cheap and we want all of them.

## Consent boundary

PostHog does not load at all until consent is granted — not `opt_out_capturing_by_default`, which still loads the library and can touch storage. Mechanics in [environments.md](environments.md).

Sentry is not consent-gated: it carries no PII, and session replay is off. Revisit that if replay is ever enabled, because at that point it is recording a real person.
