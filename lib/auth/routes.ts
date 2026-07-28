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
export const SIGN_UP_PATH = "/sign-up";
export const FORGOT_PASSWORD_PATH = "/forgot-password";
export const RESET_PASSWORD_PATH = "/reset-password";

/**
 * Onboarding is blocking: a signed-in user without a completed profile is
 * sent here from every other signed-in route. See ADR-0012.
 */
export const ONBOARDING_PATH = "/onboarding";

/**
 * The two route handlers, outside `[locale]` because neither renders anything
 * — they exchange a token and redirect. Locale-prefixing them would mean
 * registering both redirect URLs with Supabase and Google twice.
 *
 * `/auth/callback` takes an OAuth `code`; `/auth/confirm` takes an email
 * `token_hash`. They are separate because the two exchanges use different
 * calls (`exchangeCodeForSession` vs `verifyOtp`) and a single handler
 * guessing between them is how one of the flows quietly stops working.
 */
export const AUTH_CALLBACK_PATH = "/auth/callback";
export const AUTH_CONFIRM_PATH = "/auth/confirm";

/**
 * There is no dashboard. `/learn` is the signed-in home, and its job is one
 * sentence and one button: what to do now, and how long it takes. See
 * docs/decisions/0011-route-map.md.
 */
export const AFTER_SIGN_IN_PATH = "/learn";

/** Routes that require a signed-in user. Prefix match, canonical paths. */
export const PROTECTED_PREFIXES = [
  "/learn",
  "/my-courses",
  "/account",
  "/admin",
  ONBOARDING_PATH,
];

/** Routes only an editor or admin may reach. Prefix match. */
export const STAFF_PREFIXES = ["/admin"];

/**
 * Routes a signed-in user should be bounced away from.
 *
 * `/reset-password` is deliberately **not** here. Arriving from a recovery
 * email means `/auth/confirm` has already established a session, so the
 * person setting a new password is signed in by definition — listing it here
 * would bounce every one of them to `/learn` with the password unchanged,
 * and the failure would look like a broken email link.
 */
export const GUEST_ONLY_PREFIXES = [
  SIGN_IN_PATH,
  SIGN_UP_PATH,
  FORGOT_PASSWORD_PATH,
];

/**
 * Rejects anything that is not a path on this site.
 *
 * The sign-in page carries a `?next=` parameter so a bounced visitor returns
 * where they were going, and that parameter is attacker-controlled: a link to
 * `/sign-in?next=https://evil.example` would hand a freshly authenticated
 * user straight to someone else's site, wearing our domain in the referrer.
 *
 * `//evil.example` and `/\evil.example` are the two that a naive
 * `startsWith("/")` check lets through — browsers read both as
 * protocol-relative URLs.
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;

  return value;
}

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
