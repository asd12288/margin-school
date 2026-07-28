# ADR-0012 — Onboarding blocks

**Status:** Accepted · 2026-07-28

## Context

Phase 4 adds accounts. A new account arrives with a profile row containing a
role, a locale defaulted to `fr`, and nothing else — no name, no sense of what
the person already knows, no idea what they came for.

Phase 12 is the phase that pays for that information: concept mastery, a
placement diagnostic, "what to do next". It is also the phase furthest away.
The question is whether to ask now, ask later, or ask optionally.

Asking later is the expensive option in a specific way: the people who signed
up before the questions existed are exactly the cohort with the most history,
and they are the ones a recommendation engine most wants to place correctly.
Backfilling means interrupting established users with a form, which is a worse
interruption than the same form on day one.

## Decision

Ask four questions — name, language, experience level, goal — immediately after
sign-up, and **block every signed-in route until they are answered**.

`requireOnboardedProfile()` in [lib/auth/dal.ts](../../lib/auth/dal.ts) is the
gate. `/learn`, `/my-courses`, `/account` and `/admin` all call it, directly or
through `requireRole()`. Only `/onboarding` itself and `/reset-password` use the
weaker `requireProfile()`, and both for stated reasons.

**Completion is one timestamp**, `profile.onboarded_at`. Not "display_name is
not null", not a count of populated columns — a single explicit signal, written
in the same statement as the four answers, so a profile is never half-finished.

The alternative considered and rejected was skippable-with-a-nudge: a "skip for
now" link, plus a prompt on `/learn` for anyone who took it. It is the lower
friction option and it is the one most products pick.

## Consequences

- **A drop-off point sits at the highest-intent moment in the funnel**, between
  `signup_completed` and first lesson. That cost is real and it is the reason
  the form is four questions on one screen rather than a wizard: the whole
  thing must read as thirty seconds of work, not as a process.
- **Every downstream feature can assume the data exists.** No null-handling for
  level or goal, no "complete your profile" banner, no second cohort.
- **The form must work without JavaScript.** A blocking door that needs JS is a
  door some people cannot open at all, and unlike sign-up there is no
  alternative route past it. This is why the choice controls are native radio
  inputs rather than Radix's, and why onboarding is not a multi-step wizard.
- **`/onboarding` must never gate itself.** Calling `requireOnboardedProfile()`
  there is an infinite redirect. It calls `requireProfile()` and checks
  `onboarded_at` by hand, redirecting *away* if it is already set.
- The proxy cannot enforce this. It reads a cookie and never the database, so
  the check has to live in the Data Access Layer — which is where authorization
  belongs anyway ([lib/auth/dal.ts](../../lib/auth/dal.ts)).

## Revisit if

Analytics show meaningful drop-off between `signup_completed` and the first
lesson. The fallback is the rejected option: make it skippable, and prompt on
`/learn`. Nothing in the schema has to change to do that — `onboarded_at` stays
the signal, and the gate becomes a nudge.
