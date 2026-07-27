import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";

import {
  GUEST_ONLY_PREFIXES,
  PROTECTED_PREFIXES,
  SIGN_IN_PATH,
  AFTER_SIGN_IN_PATH,
  matchesPrefix,
  stripLocale,
} from "@/lib/auth/routes";

/**
 * Runs before every matched request. Two jobs, and deliberately no more:
 *
 * 1. **Refresh the auth token.** Supabase access tokens are short-lived. If
 *    nothing refreshes them, a user is silently signed out mid-session. This
 *    is the reason the file exists.
 * 2. **Optimistic redirects**, so a signed-out visitor never sees a flash of
 *    protected UI before being bounced.
 *
 * It is **not a security boundary.** It reads a cookie; it does not check
 * roles or touch the database. Real authorization lives in the Data Access
 * Layer (`lib/auth/dal.ts`), as close to the data as possible. Anyone reading
 * this file should assume it can be bypassed and that nothing depends on it.
 *
 * Note: `middleware.ts` was renamed to `proxy.ts` in Next 16.
 */
/**
 * next-intl's routing middleware. It redirects a bare `/dashboard` to
 * `/fr/dashboard` and negotiates the locale from `Accept-Language` on first
 * visit.
 */
const handleIntl = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // Locale routing runs first, and its result becomes the base response so the
  // cookies Supabase refreshes below are set on the object that is actually
  // returned. Running it after the auth checks would mean redirecting an
  // unauthenticated user to a locale-less `/sign-in`, which next-intl would
  // then redirect again — two round trips for one navigation.
  let response = handleIntl(request);

  // A redirect or rewrite from locale routing is final; there is nothing to
  // authorize about a URL that is about to change.
  if (response.headers.get("location")) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          // Rebuild the response so the refreshed cookies reach both the
          // browser and the server components rendering this request. The
          // rebuild has to go back through locale routing, or the rewrite it
          // applied is lost and every request lands on the unprefixed path.
          const rebuilt = handleIntl(request);
          for (const [key, value] of response.headers.entries()) {
            if (!rebuilt.headers.has(key)) rebuilt.headers.set(key, value);
          }
          response = rebuilt;

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Do not remove or reorder. This call is what refreshes the token, and it
  // must happen before any redirect below, or the redirected request carries
  // a stale one. `getUser` validates with the auth server rather than trusting
  // the cookie, which is also why it is not `getSession`.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Compare locale-free, redirect locale-prefixed. The constants in routes.ts
  // are stored bare so neither side needs two variants.
  const locale = pathname.split("/")[1];
  const prefix = routing.locales.includes(
    locale as (typeof routing.locales)[number],
  )
    ? `/${locale}`
    : `/${routing.defaultLocale}`;
  const unprefixed = stripLocale(pathname, routing.locales);

  if (!user && matchesPrefix(unprefixed, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = `${prefix}${SIGN_IN_PATH}`;
    // Preserve where they were going so sign-in can return them there —
    // including the locale, or the return trip changes language.
    url.searchParams.set("next", pathname);

    return NextResponse.redirect(url);
  }

  if (user && matchesPrefix(unprefixed, GUEST_ONLY_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = `${prefix}${AFTER_SIGN_IN_PATH}`;
    url.search = "";

    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /**
     * Everything except static assets and image files.
     *
     * The matcher matters more than it looks: this runs on prefetches too, and
     * each run costs a round trip to the auth server. Excluding assets keeps
     * that off the hot path for anything that could never carry a session.
     */
    "/((?!_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
