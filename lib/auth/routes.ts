/**
 * Auth-related route paths, in one place so the proxy and the Data Access
 * Layer cannot drift apart.
 *
 * These are stored locale-free. Real URLs carry a locale prefix (`/fr/…`,
 * `/en/…`), so `matchesPrefix` strips it before comparing and the callers that
 * build redirects add it back. Keeping the constants bare is what stops every
 * one of them needing two variants.
 */
export const SIGN_IN_PATH = "/sign-in";

/**
 * There is no dashboard. `/learn` is the signed-in home, and its job is one
 * sentence and one button: what to do now, and how long it takes. See
 * docs/decisions/0011-route-map.md.
 */
export const AFTER_SIGN_IN_PATH = "/learn";

/** Routes that require a signed-in user. Prefix match, canonical paths. */
export const PROTECTED_PREFIXES = ["/learn", "/my-courses", "/account", "/admin"];

/** Routes only an editor or admin may reach. Prefix match. */
export const STAFF_PREFIXES = ["/admin"];

/** Routes a signed-in user should be bounced away from. */
export const GUEST_ONLY_PREFIXES = ["/sign-in", "/sign-up"];

/**
 * Strips a leading locale segment, so `/fr/dashboard` compares as
 * `/dashboard`. Returns the path unchanged when there is no locale — route
 * handlers under `/api` never carry one.
 */
export function stripLocale(pathname: string, locales: readonly string[]) {
  const [, first, ...rest] = pathname.split("/");
  if (!locales.includes(first)) return pathname;
  return `/${rest.join("/")}`;
}

export function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Resolves a request to its canonical (untranslated) path.
 *
 * next-intl serves `/fr/compte` and rewrites it to `/fr/account` internally.
 * The prefixes above are canonical, so matching the raw pathname would mean
 * every French URL quietly stops matching and protected routes stop
 * redirecting — for French users only, which is the kind of bug you never see
 * because you are not one of them.
 *
 * `NextResponse.rewrite` sets an absolute URL; a bare path is accepted too so
 * the helper is not coupled to that detail.
 */
export function canonicalPathFromRewrite(
  rewrite: string | null,
  fallback: string
): string {
  if (!rewrite) return fallback;
  if (rewrite.startsWith("/")) return rewrite;

  try {
    return new URL(rewrite).pathname;
  } catch {
    return fallback;
  }
}
