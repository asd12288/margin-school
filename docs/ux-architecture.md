# UX architecture

There is no single global loading treatment. **Every route is assigned one of three tiers**, and the assignment is an architectural decision made once, deliberately, when the route is created.

Verified against the installed Next.js 16.2.12 docs in `node_modules/next/dist/docs/`. Confirm exact APIs there before writing code — this document describes the architecture, not the API surface.

## Tier 1 — Prerendered. No loading state at all.

**Applies to:** marketing pages, catalog grid, course detail, free lesson previews, category pages.

This content is identical for everyone and changes only when content is published. Cache it, tag it, invalidate the tag from the admin on publish.

**A skeleton in Tier 1 is a bug.** It means something that should have been instant was not cached. This is also what makes SEO work — the acquisition channel depends on it.

**A public content route must return a real `404` HTTP status, not merely render a 404 body, before it is exposed to search.** Rendering the designed not-found page while still returning `200` is a soft 404 — search engines index the URL as real content. This is easy to get right by accident and wrong by accident: under this project's Cache Components setup, a `notFound()` that resolves inside a `<Suspense>` boundary (required whenever the matched value isn't in that route's `generateStaticParams` list — see `app/[locale]/(public)/course/[course]/page.tsx`) can only ship `200` with `<meta name="robots" content="noindex">`, because the status is committed the moment the Suspense fallback streams. `dynamicParams` — the pre-Cache-Components escape hatch for this — no longer exists once Cache Components is enabled. Before a Tier 1 route with unenumerated params is linked from a sitemap or otherwise made indexable, confirm it returns a genuine `404`, not a `noindex`-tagged `200`.

## Tier 2 — Instant shell, streamed data.

**Applies to:** `/learn`, my courses, study area, admin lists — anything with a stable frame and personal content.

The frame — navigation, sidebar, page header, course title — renders instantly from cache. Only genuinely personal parts (progress, position, mastery) stream in behind Suspense.

### Instant navigation

Next 16 ships `unstable_instant`, which validates at build time that Suspense boundaries are placed correctly for **client navigation** — catching a misplaced boundary that would otherwise only surface as a blank screen in production. It is on, and it is enforcing.

`next/root-params` is what made it usable. Under validation every server `params` access defers to the Runtime stage (`createServerParamsInInstantValidation` in `next/dist/server/request/params.js`), so *any* `await params` outside a `<Suspense>` boundary blocks the static shell — including one that only wants `locale` for `setRequestLocale`. Declaring `samples` fixes *which* params may be read, not *when* they resolve. `next/root-params` is the exemption: a root param is part of the route key, so `getRootParam` resolves it immediately and a per-locale static shell genuinely exists. It is the shipped replacement for `unstable_rootParams`, which `version-16.md` still describes as removed with no alternative; the module exists but is undocumented and untyped, hence the annotations at each call site.

**Where the config lives, and why it differs by shell:**

| Segment | Config | Why |
| --- | --- | --- |
| `(app)/layout.tsx` | layout-level | Covers every app route at once. Its `<Suspense>` around `children` is load-bearing — each app page awaits `params` in its body. |
| `(public)/layout.tsx` | **none, and cannot have one** | See below. |
| `(public)/courses`, `course/[course]`, `legal/[doc]` | page-level | The public routes that can satisfy it. A page-level config still re-renders the shell during validation, so the shell is covered by each. |
| `(public)/[...rest]` | none | Cannot ever be validated — its whole job is to `notFound()`. |

The public shell cannot carry a layout-level config because a config there applies to every route in the group, including `[...rest]`, which can never render (`Could not validate unstable_instant because an error prevented the target segment from rendering`). A child cannot opt out either: `isPageAllowedToBlock` in `next/dist/server/app-render/instant-validation/instant-config.js` walks top-down and returns `false` as soon as it meets a non-`false` config above it, so `export const unstable_instant = false` on the catch-all is ignored.

**Rules the build enforces, each learned by hitting it:**

- Samples must name **every** param the route reads, including ones read inside `<Suspense>`. Inner segments *replace* an outer segment's samples rather than merging (`resolveInstantConfigSamplesForPage`), so `course/[course]` must name `locale` *and* `course`.
- `searchParams` must be declared too. `q: null` is meaningful — it validates the page as a visitor who searched for nothing.
- The config is read by **static analysis, not evaluation**. `sampleCourses[0].slug` fails with `Invalid segment configuration export detected`; the slug must be a literal. `as const` fails for the same reason — the extractor has no case for `TsAsExpression`.
- Samples are rendered for real, so a made-up slug `notFound()`s and validates the not-found path instead of the page.

**Not enabled on the fully-static public pages** (`/`, `/about`, `/pricing`, `/concepts`, `/help`). They trip `next-prerender-dynamic-metadata`: with no dynamic hole of their own, metadata resolution becomes the sole blocking one, and localized metadata is inherently params-dependent. Worth revisiting when the metadata story settles.

**What `cacheComponents` does and this does not.** `cacheComponents` is what fails the build on *uncached data* — a session read in the header — and that remains the protection that matters most; verified by unwrapping `AccountSlot`, which fails on routes that have no instant config at all. `unstable_instant` adds a narrower, different check: `params`/`searchParams` holes that block the static shell at client-navigation entry points. Verified by removing the `<Suspense>` around `children` in `(app)/layout.tsx`, which `cacheComponents` tolerates and instant validation rejects with `Build-time instant validation failed for route "/[locale]/account"`.

Cached content and personal data must never be fetched inside the same cached function. Cache the frame; stream the person.

### Suspense-gating is not optional under Cache Components

`requireProfile()` and `requireRole()` ([lib/auth/dal.ts](../lib/auth/dal.ts)) read cookies to identify the caller. Under `cacheComponents`, any uncached read of cookies, headers or `searchParams` outside a `<Suspense>` boundary **fails the build**, not just at runtime. So the gate cannot live in a page's top-level async function — it has to live in a separate inner async component, with the page itself wrapped around a `<Suspense>` boundary:

```tsx
export default async function LearnPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main>
      <Suspense fallback={null}>
        <LearnFrame />
      </Suspense>
    </main>
  );
}

async function LearnFrame() {
  const profile = await requireProfile();
  // ...
}
```

Whatever sits outside the boundary is what renders instantly — that is the whole mechanism this tier depends on. Today every gated route (`/learn`, `/my-courses`, `/account`, `/admin`) is entirely gated content, so `fallback={null}` is correct: there is no chrome to show while the gate resolves. That stops being true once Phase 9 gives these routes real static chrome (page header, nav) wrapped around a personal core — at that point the static chrome moves outside the boundary and only the genuinely personal part stays inside, per the split above. `fallback={null}` on a route with real chrome would blank that chrome on every navigation instead of leaving it in place.

Precedent for the pattern: `app/[locale]/(internal)/debug/observability/page.tsx`.

### `Link` from `i18n/navigation` cannot be used inside `use cache`

[i18n/routing.ts](../i18n/routing.ts) makes one import mandatory everywhere — `Link` from [i18n/navigation.ts](../i18n/navigation.ts), never `next/link` — because the wrapper carries the active locale and a bare link drops a French reader onto the default one.

**Inside a `use cache` scope that rule inverts, and the failure is a hard render error rather than a wrong URL.** The wrapper resolves the active locale through next-intl's `getServerLocale()`, which falls through to `headers()` whenever no request-scoped locale is set — and `setRequestLocale` is invisible inside a cache scope, for the same reason `getTranslations()` has to be called as `getTranslations({ locale })` there. The result is *"used `headers()` inside \"use cache\""* on every render of the route.

The fix is `getPathname({ href, locale })` — the function the wrapper is built on, which takes the locale as an argument and reads nothing from the request — with `next/link` rendering the resolved string. `app/[locale]/(public)/course/[course]/page.tsx` resolves its three static destinations once at the top of the cached component so the exception is visible in one place.

TypeScript cannot catch this: the wrapper's signature is identical either side of the boundary. It only appears when the page is rendered.

## Tier 3 — Optimistic. Never a spinner.

**Applies to:** mark complete, favorite, enroll, save note, progress ticks, quiz answers.

Update the UI immediately, reconcile with the server after, roll back on failure.

If a user clicks "complete" and waits, the app feels broken — even at 200ms. This is the cheapest perceived-performance win available and the one most often skipped.

## Routes

The full map, settled once in [ADR-0011](decisions/0011-route-map.md) because URLs are the expensive thing to revise. Canonical routes are the keys in [i18n/routing.ts](../i18n/routing.ts); French segments are translated, not just prefixed.

### Public — Tier 1, prerendered, indexed

| Route (canonical) | French | Tier | Built in |
| --- | --- | --- | --- |
| `/{locale}` | `/fr` | 1 | 3 (placeholder), 8 (real) |
| `/{locale}/courses` | `/fr/catalogue` | 1 | 3 (fixtures), 8 |
| `/{locale}/courses/{group}` | `/fr/catalogue/{group}` | 1 | 8 |
| `/{locale}/courses/{group}/{sub}` | `/fr/catalogue/{group}/{sub}` | 1 | 8 |
| `/{locale}/course/{course}` | `/fr/cours/{course}` | 1 | 3 (fixtures), 8 |
| `/{locale}/course/{course}/{lesson}` | `/fr/cours/{course}/{lesson}` | 1 | 8 |
| `/{locale}/concepts` | `/fr/notions` | 1 | 3 (frame), 8 |
| `/{locale}/concepts/{concept}` | `/fr/notions/{concept}` | 1 | 8+ |
| `/{locale}/pricing` | `/fr/abonnement` | 1 | 3 (frame), 10 |
| `/{locale}/about` | `/fr/a-propos` | 1 | 3 (frame), 8 |
| `/{locale}/help` | `/fr/aide` | 1 | 3 (frame), unscheduled |
| `/{locale}/legal/{doc}` | `/fr/mentions/{doc}` | 1 | 3 (placeholder), 8 |

`/about`, `/pricing`, `/concepts` and `/help` exist as placeholder frames from Phase 3 rather than waiting for Phase 8, because the footer links to them and a footer link that 404s is worse than a page that admits it is unwritten. `/help` is the one route here that [ADR-0011](decisions/0011-route-map.md) did not settle up front — it was added with the full footer.

### Auth

| Route | French | Tier | Built in |
| --- | --- | --- | --- |
| `/{locale}/sign-in`, `/sign-up` | `/fr/connexion`, `/fr/inscription` | 1 | 3 (frame), 4 |
| `/{locale}/forgot-password` | `/fr/mot-de-passe-oublie` | 1 | 4 |
| `/{locale}/reset-password` | `/fr/nouveau-mot-de-passe` | 1 | 4 |
| `/{locale}/onboarding` | `/fr/bienvenue` | 1 | 4 |
| `/auth/callback` | *(no locale — route handler)* | — | 4 |
| `/auth/confirm` | *(no locale — route handler)* | — | 4 |

`/sign-in` stays Tier 1 despite carrying `?next=` and `?error=`. Awaiting `searchParams` in the page body is what would have cost that — under Cache Components an uncached read outside `<Suspense>` fails the build outright — and the obvious fix, wrapping the form in a boundary, would have put a skeleton where the page's only action goes. Both parameters are read inside the client form instead, each behind a boundary around a component that renders nothing in the common case. Any future page tempted to `await searchParams` should look at `components/margin/auth/sign-in-form.tsx` first.

`/reset-password` is signed-in-only and is deliberately **not** in `GUEST_ONLY_PREFIXES`: arriving from a recovery email means `/auth/confirm` has already established a session, so bouncing signed-in users away from it would break the flow it exists for.

**Both route handlers redirect with `redirect()` from `next/navigation`, never `NextResponse.redirect()`.** The Supabase call that precedes each of them writes the new session through the `cookies()` store, and only the response Next builds itself carries those writes. A hand-built `NextResponse` drops them silently: the URL is right, the token exchange succeeded, and the visitor arrives signed out — bounced straight back to sign-in holding a link that has just been spent. It reads as an invalid token and is not one.

The two route handlers live outside `[locale]` and are **excluded from the proxy matcher**. next-intl's middleware has no notion of a route it should leave alone and prefixes anything unprefixed, so `/auth/callback` became `/fr/auth/callback` and 404'd — taking Google sign-in and the entire password reset with it. `/api/*` had the same fault before these routes existed. One exclusion in [proxy.ts](../proxy.ts) covers both.

`/onboarding` blocks every other signed-in route until it is finished — see [ADR-0012](decisions/0012-blocking-onboarding.md). The check cannot live in the proxy, which reads a cookie and never the database; it is `requireOnboardedProfile()` in the Data Access Layer.

### App — Tier 2, private, `noindex`

| Route | French | Tier | Built in |
| --- | --- | --- | --- |
| `/{locale}/learn` | `/fr/apprendre` | 2 | 3 (frame), 9 |
| `/{locale}/learn/{course}/{lesson}` | `/fr/apprendre/{course}/{lesson}` | 2 | 9 |
| `/{locale}/my-courses` | `/fr/mes-cours` | 2 | 3 (frame), 9 |
| `/{locale}/review` | `/fr/revisions` | 2 | 12 |
| `/{locale}/account`, `/account/billing` | `/fr/compte`, `/fr/compte/facturation` | 2 | 3 (frame), 4 / 10 |

### Admin — Tier 2, private, `noindex`

| Route | French | Tier | Built in |
| --- | --- | --- | --- |
| `/{locale}/admin/…` | *(untranslated)* | 2 | 3 (frame), 7 |

Untranslated on purpose: no SEO surface, and a content author navigating admin is not helped by a translated URL.

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
| **Empty** | First-run especially — a new subscriber's `/my-courses` is empty and it is their first impression |
| **Error** | Recoverable, with a retry. Never a bare stack trace |
| **Locked** | "Upgrade to continue". Shown constantly in a subscription product — deserves real design, never a redirect |
| **Unavailable in this language** | A real state, per [content-model.md](content-model.md), not an error |

## Navigation feedback

Every click is acknowledged within one frame — pending state on the link or button, plus a top-level progress indicator for slower transitions. An unacknowledged click reads as a broken app regardless of how fast the page eventually arrives.

## Interface inspiration

Take Udemy's **information architecture**: course card, curriculum accordion, "what you'll learn", preview affordance, progress in the header. It is well-tested and users already recognise it.

Do not take Udemy's **commerce psychology**: price anchoring, countdown discounts, struck-through prices, money-back badges. All of it exists to convert a single purchase and is incoherent in an all-access subscription. Our equivalent lever is demonstrated depth — how much is here, how good it is, how far you would get.
