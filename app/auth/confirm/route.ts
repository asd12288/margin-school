import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import {
  ONBOARDING_PATH,
  RESET_PASSWORD_PATH,
  SIGN_IN_PATH,
} from "@/lib/auth/routes";
import { sameOriginPath } from "@/lib/auth/site-url";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

/**
 * Where every emailed link lands: confirm your address, reset your password,
 * confirm an address change.
 *
 * Separate from `/auth/callback` because the exchange is a different call.
 * OAuth returns a `code` for `exchangeCodeForSession`; an email carries a
 * `token_hash` for `verifyOtp`. One handler guessing between them is how one
 * of the two flows quietly stops working after an upgrade.
 *
 * This shape is required by PKCE, not chosen. Supabase's stock email templates
 * link to `{{ .ConfirmationURL }}`, which resolves through Supabase's own
 * `/verify` endpoint and hands the browser a token in the URL fragment — a
 * fragment never reaches the server, so a server-rendered app cannot see it.
 * The templates in `supabase/templates/` are rewritten to send `{{ .TokenHash }}`
 * here instead. **A deployment that has not applied those templates will have
 * working sign-in and a broken password reset**, which is why they are in the
 * repo rather than only in the dashboard — see docs/environments.md.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = await sameOriginPath(searchParams.get("next"));

  // The locale is read back off the destination the email carried, so a
  // French reader who asked for a reset stays in French through the round
  // trip. Falls back to the default rather than guessing from headers: an
  // email client's `Accept-Language` is not the person's.
  const locale = localeFromPath(next);

  if (!tokenHash || !type) {
    return redirectToSignIn(origin, locale, "linkInvalid");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  /**
   * Expiry is the common case by a wide margin — recovery tokens last an hour
   * and are single-use, so a second click on the same link fails here too.
   * The sign-in page turns this key into an offer to send a fresh one rather
   * than a dead end.
   */
  if (error) return redirectToSignIn(origin, locale, "linkExpired");

  const fallback = getPathname({
    href: type === "recovery" ? RESET_PASSWORD_PATH : ONBOARDING_PATH,
    locale,
  });

  return NextResponse.redirect(new URL(next ?? fallback, origin));
}

/** `/fr/nouveau-mot-de-passe` → `fr`. */
function localeFromPath(path: string | null): Locale {
  const segment = path?.split("/")[1];

  return routing.locales.includes(segment as Locale)
    ? (segment as Locale)
    : routing.defaultLocale;
}

function redirectToSignIn(origin: string, locale: Locale, reason: string) {
  const url = new URL(getPathname({ href: SIGN_IN_PATH, locale }), origin);
  url.searchParams.set("error", reason);

  return NextResponse.redirect(url);
}
