/**
 * Auth-related route paths, in one place so the proxy and the Data Access
 * Layer cannot drift apart.
 *
 * Locale prefixes (`/fr`, `/en`) are not applied yet — routing lands with the
 * shells in PRO-152. When it does, these become locale-aware and everything
 * downstream follows, because nothing else hardcodes them.
 */
export const SIGN_IN_PATH = "/sign-in";
export const AFTER_SIGN_IN_PATH = "/dashboard";

/** Routes that require a signed-in user. Prefix match. */
export const PROTECTED_PREFIXES = ["/dashboard", "/study", "/account", "/admin"];

/** Routes only an editor or admin may reach. Prefix match. */
export const STAFF_PREFIXES = ["/admin"];

/** Routes a signed-in user should be bounced away from. */
export const GUEST_ONLY_PREFIXES = ["/sign-in", "/sign-up"];

export function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
