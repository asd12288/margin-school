# UX architecture

There is no single global loading treatment. **Every route is assigned one of three tiers**, and the assignment is an architectural decision made once, deliberately, when the route is created.

Verified against the installed Next.js 16.2.12 docs in `node_modules/next/dist/docs/`. Confirm exact APIs there before writing code — this document describes the architecture, not the API surface.

## Tier 1 — Prerendered. No loading state at all.

**Applies to:** marketing pages, catalog grid, course detail, free lesson previews, category pages.

This content is identical for everyone and changes only when content is published. Cache it, tag it, invalidate the tag from the admin on publish.

**A skeleton in Tier 1 is a bug.** It means something that should have been instant was not cached. This is also what makes SEO work — the acquisition channel depends on it.

## Tier 2 — Instant shell, streamed data.

**Applies to:** dashboard, my courses, study area, admin lists — anything with a stable frame and personal content.

The frame — navigation, sidebar, page header, course title — renders instantly from cache. Only genuinely personal parts (progress, position, mastery) stream in behind Suspense.

Next 16 provides a real safety net: exporting `unstable_instant` from a route validates at dev and build time that Suspense boundaries are placed correctly, catching a misplaced boundary that would silently block client navigation. **Use it on every route that should feel instant** — the failure it prevents is a user watching a blank screen, which is otherwise only discovered in production.

Cached content and personal data must never be fetched inside the same cached function. Cache the frame; stream the person.

## Tier 3 — Optimistic. Never a spinner.

**Applies to:** mark complete, favorite, enroll, save note, progress ticks, quiz answers.

Update the UI immediately, reconcile with the server after, roll back on failure.

If a user clicks "complete" and waits, the app feels broken — even at 200ms. This is the cheapest perceived-performance win available and the one most often skipped.

## Skeleton rules

1. **Layout-identical to the real content.** Same dimensions. A skeleton that causes layout shift is worse than a spinner.
2. **Never skeleton the shell.** Navigation, sidebar and header appear instantly, always. A page that flashes its own navigation feels like a website; one that does not feels like an app.
3. **Component-level, not page-level.** A `loading.tsx` covering a whole route is the lazy option and blinks the entire screen. Prefer Suspense boundaries around the specific regions that are actually slow.
4. **Nothing under ~300ms gets a skeleton.** Below that it flashes and reads as *slower*.
5. **Unknown-length lists get 3–6 placeholder cards.** Never guess the real count.

## The study area is an app, not a page

- Keep the player shell mounted across lessons. Never full-reload between them.
- Prefetch the next lesson while the learner is reading the current one.
- Preserve scroll position, video position, and panel state across navigation.

This behaviour is most of the felt difference between "an LMS" and "a product". It is a Phase 9 requirement, not a polish item.

## States are designed, not discovered

Every data-driven surface ships with five states, designed together:

| State | Notes |
| --- | --- |
| **Loading** | Per the tier above |
| **Empty** | First-run especially — a new subscriber's dashboard is empty and it is their first impression |
| **Error** | Recoverable, with a retry. Never a bare stack trace |
| **Locked** | "Upgrade to continue". Shown constantly in a subscription product — deserves real design, never a redirect |
| **Unavailable in this language** | A real state, per [content-model.md](content-model.md), not an error |

## Navigation feedback

Every click is acknowledged within one frame — pending state on the link or button, plus a top-level progress indicator for slower transitions. An unacknowledged click reads as a broken app regardless of how fast the page eventually arrives.

## Interface inspiration

Take Udemy's **information architecture**: course card, curriculum accordion, "what you'll learn", preview affordance, progress in the header. It is well-tested and users already recognise it.

Do not take Udemy's **commerce psychology**: price anchoring, countdown discounts, struck-through prices, money-back badges. All of it exists to convert a single purchase and is incoherent in an all-access subscription. Our equivalent lever is demonstrated depth — how much is here, how good it is, how far you would get.
