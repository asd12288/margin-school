import { notFound } from "next/navigation";

/**
 * Anything under a locale that matches no real route.
 *
 * next-intl gives every request a locale prefix — `/de/anything` arrives here
 * as `/fr/de/anything` — so a URL that matches nothing still lands inside the
 * locale segment. Catching it here rather than at the routing layer is what
 * keeps the 404 inside the i18n-aware tree: one not-found UI, the reader's own
 * language, the app's own theme, and no experimental config flag.
 *
 * Without this, an unmatched URL escapes `[locale]` entirely and falls through
 * to Next's own unstyled 404 — which is what this branch originally shipped.
 *
 * This page reads no `params` and reaches for no `<Suspense>`. Both were
 * tried and both are wrong here, for the same underlying reason:
 *
 * `notFound()` reached through a `<Suspense>` boundary streams — the static
 * shell ships first, `notFound()` resolves after — and Next serves a `200`
 * for a streamed response, only a `404` for a non-streamed one (see the
 * "Status Codes" note on `not-found.js`). A locale-aware `/de/...` silently
 * carrying a `200` defeats the one thing this route exists for.
 *
 * `generateStaticParams` below is what keeps this route non-streamed. It
 * returns one placeholder `rest` value per locale, which does two things:
 * it gives Next a concrete value to build this segment's static shell from
 * — `SiteHeader`'s `NavLink` (`useSelectedLayoutSegment()`) and
 * `LocaleSwitcher` (`useParams()`) sit in `(public)/layout.tsx`, outside this
 * file, and need *some* resolved value for `rest` to prerender at all — and,
 * because `dynamicParams` defaults to `true`, it makes every other path under
 * this route render the same way a page with `generateStaticParams` always
 * has: fully server-rendered per request, no partial prerender, no streaming,
 * a real `404` before the first byte.
 *
 * The placeholder value itself is `__reserved__`, not `not-found` — a real
 * content slug can legitimately be `not-found` (see docs/content-model.md;
 * nothing reserves that word), which would collide with this build-time
 * placeholder and silently make `/fr/not-found` and `/en/not-found` resolve
 * here instead of to that content. Double underscores read as obviously
 * synthetic and match the convention Next itself uses for reserved segments
 * (`_next`), so no real slug is ever likely to collide with it.
 */
export function generateStaticParams() {
  return [{ rest: ["__reserved__"] }];
}

export default function UnmatchedRoute() {
  notFound();
}
