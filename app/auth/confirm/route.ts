import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
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
/**
 * **`redirect()` from `next/navigation`, never `NextResponse.redirect()`.**
 *
 * This is the whole reason the flow works. `verifyOtp` writes the new session
 * through the `cookies()` store, and Next attaches those writes to the
 * response *it* builds. `NextResponse.redirect()` constructs a different
 * response object, which carries none of them — so the browser followed the
 * redirect with no session, `requireUser()` on `/reset-password` found nobody,
 * and the person was bounced to sign-in holding a link that had just been
 * silently spent. The URL was right and the exchange had succeeded; only the
 * cookies were missing, which is what made it look like the token was bad.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = await sameOriginPath(searchParams.get("next"));

  // The locale is read back off the destination the email carried, so a
  // French reader who asked for a reset stays in French through the round
  // trip. Falls back to the default rather than guessing from headers: an
  // email client's `Accept-Language` is not the person's.
  const locale = localeFromPath(next);

  const destination = await resolveDestination({ tokenHash, type, next, locale });

  // Outside everything above, and never inside a `try`: `redirect` works by
  // throwing, so a `catch` would swallow it.
  redirect(destination);
}

async function resolveDestination({
  tokenHash,
  type,
  next,
  locale,
}: {
  tokenHash: string | null;
  type: EmailOtpType | null;
  next: string | null;
  locale: Locale;
}): Promise<string> {
  if (!tokenHash || !type) return signInWithError(locale, "linkInvalid");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  /**
   * Expiry is the common case by a wide margin — recovery tokens last an hour
   * and are single-use, so a second click on the same link fails here too.
   * The sign-in page turns this key into an offer to send a fresh one rather
   * than a dead end.
   */
  if (error) return signInWithError(locale, "linkExpired");

  return (
    next ??
    getPathname({
      href: type === "recovery" ? RESET_PASSWORD_PATH : ONBOARDING_PATH,
      locale,
    })
  );
}

/** `/fr/nouveau-mot-de-passe` → `fr`. */
function localeFromPath(path: string | null): Locale {
  const segment = path?.split("/")[1];

  return routing.locales.includes(segment as Locale)
    ? (segment as Locale)
    : routing.defaultLocale;
}

function signInWithError(locale: Locale, reason: string) {
  return `${getPathname({ href: SIGN_IN_PATH, locale })}?error=${reason}`;
}
