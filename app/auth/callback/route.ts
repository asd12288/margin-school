import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getCurrentProfile } from "@/lib/auth/dal";
import { AFTER_SIGN_IN_PATH, ONBOARDING_PATH, SIGN_IN_PATH } from "@/lib/auth/routes";
import { sameOriginPath } from "@/lib/auth/site-url";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

/**
 * Where the OAuth round trip lands.
 *
 * Google sends the browser back to Supabase, Supabase sends it here with a
 * one-time `code`, and this handler trades that code for a session cookie.
 * The exchange has to happen server-side: under PKCE the verifier lives in a
 * cookie this origin set, which is the whole point of the flow and the reason
 * `@supabase/ssr` pins `flowType: "pkce"`.
 *
 * Outside `[locale]` deliberately — see the note in lib/auth/routes.ts. The
 * locale rides in a query parameter that `signInWithGoogleAction` attaches,
 * because nothing else in this request remembers what language the person was
 * reading before they left for Google.
 */
/**
 * **`redirect()` from `next/navigation`, never `NextResponse.redirect()`** —
 * see the long note in `app/auth/confirm/route.ts`. `exchangeCodeForSession`
 * writes the session through the `cookies()` store, and only the response Next
 * builds itself carries those writes. A hand-built `NextResponse` drops them
 * and the visitor arrives signed out.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const code = searchParams.get("code");
  const locale = readLocale(searchParams.get("locale"));

  /**
   * The provider can fail before we ever see a code — most commonly because
   * the person pressed "Cancel" on Google's consent screen, which is not an
   * error worth alarming them about. `access_denied` therefore returns them
   * to sign-in with nothing but the form, and anything else names the
   * failure.
   */
  const providerError = searchParams.get("error");
  if (providerError) {
    redirect(
      signInPath(locale, providerError === "access_denied" ? null : "oauthFailed"),
    );
  }

  if (!code) redirect(signInPath(locale, "oauthFailed"));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  // A code is single-use and short-lived, so the usual cause here is a
  // refresh of this URL or a stale link, not an attack.
  if (error) redirect(signInPath(locale, "linkExpired"));

  /**
   * Onboarding wins over `next`.
   *
   * A first-time Google user has a profile row — the signup trigger made one
   * — but has answered nothing, and letting them through to a deep link would
   * strand them in a product that does not know their name or their level.
   * Returning visitors keep the destination they asked for.
   */
  const profile = await getCurrentProfile();
  const onboarded = profile?.onboardedAt != null;

  const next = onboarded ? await sameOriginPath(searchParams.get("next")) : null;

  redirect(
    next ??
      getPathname({
        href: onboarded ? AFTER_SIGN_IN_PATH : ONBOARDING_PATH,
        locale,
      }),
  );
}

function readLocale(value: string | null): Locale {
  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : routing.defaultLocale;
}

/**
 * `reason` is a key under `auth.errors`, passed on the URL so the sign-in page
 * can say what went wrong. It is written by this handler and never echoed from
 * user input — the sign-in page still only renders keys it recognises, so a
 * hand-crafted `?error=` cannot inject anything.
 */
function signInPath(locale: Locale, reason: string | null) {
  const path = getPathname({ href: SIGN_IN_PATH, locale });
  return reason ? `${path}?error=${reason}` : path;
}
