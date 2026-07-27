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
export const AFTER_SIGN_IN_PATH = "/dashboard";

/** Routes that require a signed-in user. Prefix match. */
export const PROTECTED_PREFIXES = ["/dashboard", "/study", "/account", "/admin"];

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
