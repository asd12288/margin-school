# App shell + route map — design

Implements Phase 3 of [roadmap.md](../../roadmap.md), and settles the URL structure
for every phase after it.

Two things are being decided here, and only one of them is Phase 3. The shell is
a week of work. **The route map is the expensive half**, because URLs are the one
thing a public product cannot revise cheaply — changing them later costs
redirects, lost search equity, and every link anyone ever shared.

---

## 1. Scope

**In:** route groups and the shells they carry, the locale-routed URL map,
Cache Components, error and not-found boundaries, the locale switcher, navigation
feedback, and enough real routes to judge the result.

**Out, and named so nobody builds them by accident:**

| Deferred | To |
| --- | --- |
| `canAccess` and real entitlement | Phase 5 |
| Sign-in, sign-up, magic link, Google | Phase 4 |
| Catalog filters, SEO metadata, sitemaps, `hreflang` tags | Phase 8 |
| The lesson player | Phase 9 |
| Admin chrome beyond a gated frame | Phase 7 |
| `/concepts` pages — route reserved, not built | Phase 8+ |

---

## 2. The route map

Locale prefix is always present ([i18n/routing.ts](../../../i18n/routing.ts)).
Segments are translated per locale; slugs already are, per
[content-model.md](../../content-model.md) rule 3.

### Public — Tier 1, prerendered, indexed

| Route (canonical) | French | Tier | Built in |
| --- | --- | --- | --- |
| `/{locale}` | `/fr` | 1 | 3 (placeholder), 8 (real) |
| `/{locale}/courses` | `/fr/catalogue` | 1 | 3 (fixtures), 8 |
| `/{locale}/courses/{group}` | `/fr/catalogue/{group}` | 1 | 8 |
| `/{locale}/courses/{group}/{sub}` | `/fr/catalogue/{group}/{sub}` | 1 | 8 |
| `/{locale}/course/{course}` | `/fr/cours/{course}` | 1 | 3 (fixtures), 8 |
| `/{locale}/course/{course}/{lesson}` | `/fr/cours/{course}/{lesson}` | 1 | 8 |
| `/{locale}/concepts`, `/concepts/{concept}` | `/fr/notions`, `/fr/notions/{concept}` | 1 | 8+ |
| `/{locale}/pricing` | `/fr/abonnement` | 1 | 8 |
| `/{locale}/about`, `/{locale}/legal/{doc}` | `/fr/a-propos`, `/fr/mentions/{doc}` | 1 | 8 |

### Auth

| Route | French | Tier | Built in |
| --- | --- | --- | --- |
| `/{locale}/sign-in`, `/sign-up` | `/fr/connexion`, `/fr/inscription` | 1 | 3 (frame), 4 |
| `/{locale}/forgot-password`, `/reset-password` | `/fr/mot-de-passe-oublie`, … | 1 | 4 |
| `/auth/callback` | *(no locale — route handler)* | — | 4 |

### App — Tier 2, private, `noindex`

| Route | French | Tier | Built in |
| --- | --- | --- | --- |
| `/{locale}/learn` | `/fr/apprendre` | 2 | 3 (frame), 9 |
| `/{locale}/learn/{course}/{lesson}` | `/fr/apprendre/{course}/{lesson}` | 2 | 9 |
| `/{locale}/my-courses` | `/fr/mes-cours` | 2 | 3 (frame), 9 |
| `/{locale}/review` | `/fr/revisions` | 2 | 12 |
| `/{locale}/account`, `/account/billing` | `/fr/compte`, `/fr/compte/facturation` | 2 | 3 (frame), 4 / 10 |

### Admin — private, `noindex`

`/{locale}/admin/…`, untranslated segments. Internal tool, no SEO surface, and a
content author navigating it is not helped by translated URLs.

### The decisions inside that table

**There is no dashboard.** The signed-in home is `/learn`, and its job is one
sentence and one button: what to do now, and how long it takes.
[product.md:24](../../product.md) calls the next action the single highest-value
screen for a beginner; a dashboard is a stats console, which invites exactly the
gamification furniture [design-system.md:171](../../design-system.md) bans, and
which shows a new subscriber an empty room on their first impression. The player
then nests underneath: `/learn` is *what do I learn*, `/learn/x/y` is *learning
it*. `AFTER_SIGN_IN_PATH` becomes `/learn`.

**The public lesson URL is the paywall.** One canonical URL per lesson, always
rendering. Free or entitled gets the full lesson; everyone else gets the teaser
and the designed locked state. This turns the paywall into an acquisition surface
instead of a wall, and puts the upsell where a stranger actually is rather than on
a pricing page nobody visits. The player at `/learn/…` is a second URL for the
same lesson — `noindex`, canonical pointing back at the public one. Udemy splits
these two surfaces the same way.

**The French names are not literal translations, because a literal one breaks.**
English separates the list from the thing by plural — `/courses` versus
`/course/{slug}`. French *cours* is invariable, so the obvious mapping puts
`/fr/cours/{course}` and `/fr/cours/{group}` on the same shape and the router
cannot tell a course from a category. Hence `catalogue` for browsing and `cours`
for a course, which reads better in French than the English does in English. Every
other locale added later needs the same check, and the unit test in §9 enforces it.

**One second taxonomy, not three.** Udemy runs `/topic/…`, `/browse/…` and
`/career/…` in parallel as a search land-grab. Ours is `/concepts`, which is the
skill graph from [ADR-0004](../../decisions/0004-content-structure-and-concepts.md)
made public — the data has to exist anyway, it is the differentiator made visible,
and it is honest, which the other three would not be for a catalog this size.

**What is absent on purpose:** no `/cart`, no `/payment`, no per-course checkout
([ADR-0001](../../decisions/0001-subscription-only-single-publisher.md)); no
`/user/{instructor}`
([ADR-0002](../../decisions/0002-no-fictional-instructors.md)).

---

## 3. Shell architecture

```
app/
  global-error.tsx                    root-layout failures — carries its own <html>
  [locale]/
    layout.tsx                        root: html/body, fonts, providers  (exists)
    not-found.tsx                     designed, translated 404
    (public)/layout.tsx  error.tsx    public shell
      page.tsx                        landing        (moves out of [locale]/page.tsx)
      courses/page.tsx                catalog
      courses/[...category]/page.tsx  group + subgroup in one catch-all
      course/[course]/page.tsx        course detail
    (auth)/layout.tsx                 narrow centred card, no nav
      sign-in/  sign-up/
    (app)/layout.tsx  error.tsx       app shell
      learn/  my-courses/  account/
    (admin)/layout.tsx                admin frame
      admin/page.tsx
    (internal)/                       design-system, debug — minimal chrome
```

That tree is **what Phase 3 creates**, not the whole map — the Phase 8+ routes in
§2 slot into the same groups later. Route groups do not appear in URLs, so moving
`design-system` and `debug` into `(internal)` changes their file paths and not
their addresses.

Route groups rather than one layout switching on segment: the shells get
genuinely different Suspense boundaries and caching, and the nav stops being
conditional logic. Because the *root* layout remains `[locale]/layout.tsx`,
moving between groups is a client navigation — the full-reload caveat in the Next
docs applies only to multiple root layouts, which this is not.

Localized segments do not touch this tree. Files stay canonically English;
`routing.pathnames` maps them per locale.

### The mechanism that makes it work

The header must not read the session directly. `getCurrentProfile()` in a layout
makes every page beneath it dynamic and Tier 1 dies silently — the same class of
failure [i18n/routing.ts](../../../i18n/routing.ts) already records from the
`setRequestLocale` episode. So:

- the shell — logo, nav, locale switcher, theme toggle — is static and cached;
- `account-slot` alone is a `<Suspense>` boundary that reads cookies, falling back
  to a fixed-size avatar skeleton so nothing shifts (skeleton rule 1).

**Cache Components is what enforces this**, and that is the reason to enable it
now: with the flag on, reading uncached dynamic data outside a Suspense boundary
fails the build rather than silently making the route dynamic. The rule stops
being a convention someone has to remember.

`unstable_instant = { prefetch: 'static' }` on both shells is a narrower opt-in
layered on top — it validates that *client navigation* into a route is instant at
every shared layout boundary, which the flag alone does not check. Useful, but it
is not what produces the build failure above.

---

## 4. Cache Components

`cacheComponents: true` in [next.config.ts](../../../next.config.ts). It makes PPR
the default, enables `use cache` / `cacheLife` / `cacheTag`, uses React
`<Activity>` to preserve component state across client navigation, and is a hard
prerequisite for `unstable_instant`.

Enabling it now, at four routes, costs an afternoon. After Phases 8 and 9 it is a
migration across the whole catalog and player.

**Verified by spike, not assumed.** With the flag on, next-intl 4.13.4 builds
clean: both locales and the design-system page emit as `◐ Partial Prerender`.
One route fails — `/[locale]/debug/observability`, with *"Uncached data was
accessed outside of `<Suspense>`"* pointing at the analytics provider. Fixing that
route is in scope for this phase.

`<Activity>` keeping state across navigation is also what starts paying down the
Phase 9 requirement that the player shell never remount.

---

## 5. Localized pathnames

`routing.pathnames` maps every canonical route to its per-locale URL. `Link`,
`redirect`, `usePathname` and `getPathname` from
[i18n/navigation.ts](../../../i18n/navigation.ts) already resolve through it, and
`alternateLinks` defaults on, so `hreflang` `Link` headers come free from the
middleware.

Chosen over Udemy's approach deliberately: Udemy serves a French visitor
`/fr/courses/finance-and-accounting/` and shipped that course page with no
`hreflang` alternates at all. It is English-first and global; we are French-first
in a French market, and SEO is the acquisition channel
([product.md:61](../../product.md)).

### The trap this introduces

next-intl rewrites `/fr/compte` to the canonical `/fr/account` internally. But
[proxy.ts](../../../proxy.ts) matches `PROTECTED_PREFIXES` against
`request.nextUrl.pathname` — the *localized* path. Left alone, every French URL
silently stops matching, and protected routes stop redirecting **for French users
only**.

The proxy must match against the rewrite target from the intl middleware's
response, not the raw pathname. This gets an explicit test in both locales. It is
precisely the class of bug this codebase already worries about: visible only to
the users you are not.

`lib/auth/routes.ts` changes alongside — `AFTER_SIGN_IN_PATH` to `/learn`,
`PROTECTED_PREFIXES` to `/learn`, `/my-courses`, `/account`, `/admin`.

---

## 6. Components

New, in `components/margin/shell/`:

| Component | Kind | Notes |
| --- | --- | --- |
| `site-header` | server, static | Logo, primary nav, locale switcher, theme toggle, account slot |
| `site-footer` | server, static | Legal links, risk disclaimer, locale switcher |
| `app-header` | server, static | Four links. A top bar, not a sidebar — see below |
| `account-slot` | server, async | The only thing that reads the session. Lives in Suspense |
| `account-menu` | client | Signed-in dropdown |
| `locale-switcher` | client | `usePathname` + `useRouter` — swaps locale, keeps the route |
| `nav-link` | client | Active via `useSelectedLayoutSegment`, pending via `useLinkStatus` |
| `route-progress` | client | Top-level indicator for slower transitions |
| `skip-link` | server | Keyboard bypass to main content |

Everything else is reuse: `ErrorState` and `EmptyState` from
[states.tsx](../../../components/margin/states.tsx), the existing `ThemeToggle`,
`CourseCard`, `Curriculum`, the skeletons, and vendored `DropdownMenu`.

The app shell is a **top bar, not a sidebar**. Four links do not earn
`ui/sidebar.tsx`, and Phase 9 is when the player genuinely needs a rail — building
it now means designing it against a player that does not exist.

Per [design-system.md:179](../../design-system.md), no component in
`components/margin/` holds a user-facing string. Shell labels arrive as props or
through `next-intl` at the layout.

---

## 7. Data flow and where auth is enforced

Shells are static. `account-slot` is the only server component reading the
session, and it is behind Suspense.

**Auth is enforced in pages, never in layouts.** Layouts do not re-run on soft
navigation between sibling routes, so a layout-only check is bypassable by client
navigation. Every protected page calls `requireProfile()` or `requireRole()`
itself; the `(admin)` layout renders chrome and nothing more. This is the existing
rule in [lib/auth/dal.ts](../../../lib/auth/dal.ts) — authorization as close to the
data as possible — applied to layouts.

The proxy stays optimistic-only and is not a security boundary, exactly as it
already documents.

No `canAccess` in this phase. The fixtures already carry `accessState`, so locked
states render from fixture data; Phase 5 supplies the real function.

---

## 8. Error handling

| File | Renders | Notes |
| --- | --- | --- |
| `[locale]/(public)/error.tsx`, `(app)/error.tsx` | `ErrorState` | `unstable_retry` (the Next 16 prop — not `reset`), reports to Sentry |
| `app/global-error.tsx` | Minimal inline-styled page | Own `<html>`; no provider or theme is alive above it |
| `[locale]/not-found.tsx` | Designed, translated 404 | Reached via `notFound()` from pages and from `requireRole` |

`error.tsx` does not catch throws from the layout in its own segment, which is why
the boundaries sit inside the shell groups rather than at `[locale]/`.

**To verify during implementation, not assumed:** how a bad locale (`/de/…`)
resolves given that `notFound()` is called from the root layout itself
([layout.tsx:74](../../../app/[locale]/layout.tsx)). If the root layout cannot
render its own not-found, the fallback is the experimental `globalNotFound` flag,
which the Next docs recommend for exactly this shape — a root layout defined by a
top-level dynamic segment. A test asserts the outcome either way.

---

## 9. Testing

**Unit (vitest).** Every route in the pathnames map has both locales; no two
canonical routes collide on a URL in either locale; prefix matching in
`routes.ts` survives localized paths.

**E2E (playwright).** On top of a session fixture — a seeded student and a seeded
editor in local Supabase, signed in through supabase-js with the cookies injected,
so no auth UI is needed:

- the header's DOM identity survives navigation — the literal test of Phase 3's
  "navigating between routes never re-renders the navigation";
- signed-out `/learn` redirects to sign-in with `?next`, **in both locales**,
  including the translated segment;
- a student gets 404 on `/admin`; an editor gets through;
- the locale switcher preserves the current route across translated segments;
- the 404 and error states render as designed;
- axe and contrast on the new shells, extending the existing suites.

Optional: `@next/playwright`'s `instant()` helper asserts the static shell renders
before dynamic content. Not installed today; add only if the shell's Suspense
boundaries prove hard to pin down otherwise.

---

## 10. Docs changed in the same commits

- **New ADR 0011** — the route map and localized pathnames. URL structure is
  expensive to reverse, and "why is there no dashboard" is exactly the question a
  future agent answers wrongly without a record.
- **ux-architecture.md** — the route table with its tier per route.
- **roadmap.md** — record the actual sequencing. Phases 1 and 3 were skipped and 4
  half-built; the deviation is deliberate and documented in content-model.md, but
  roadmap.md still reads as though Phase 1 gates everything.
- **design-system.md:236** — stale. It says the arbitrary-value lint rule does not
  exist "yet" and should land before the app shell. It exists
  ([eslint.config.mjs:102](../../../eslint.config.mjs)), and line 194 of the same
  doc says so.

---

## 11. Risks

| Risk | Mitigation |
| --- | --- |
| `unstable_instant` is an unstable API | We design to its constraint anyway; if it churns, the Suspense structure it validates still stands |
| Cache Components migration surfaces more than the debug route | Spike found exactly one failure at four routes; the blast radius grows with every phase we defer it |
| Localized pathnames + proxy matching | Called out in §5, with a test in both locales |
| `global-error` under a `[locale]` root layout | Verified during implementation; `globalNotFound` is the documented fallback |

---

## 12. Done when

Navigating between any two routes never re-renders the navigation, and a test
proves it. A signed-out visitor to `/fr/apprendre` lands on `/fr/connexion` with a
working return path. A student cannot reach `/admin` and an editor can, enforced
server-side. Every shell renders a designed 404 and a designed error with a retry.
The production build emits the public routes as prerendered, and fails if anyone
reads personal data above a Suspense boundary.
