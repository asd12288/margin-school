import "server-only";

import { headers } from "next/headers";

/**
 * Where this deployment lives, as an absolute origin.
 *
 * Needed because three things leave our process and have to come back:
 * Google's OAuth redirect, Supabase's confirmation email, and Supabase's
 * recovery email. All three take an absolute URL, and all three land on a
 * different origin per environment — localhost, a per-branch preview, and
 * production.
 *
 * Read from the request rather than from an env var, so a preview deployment
 * returns to *itself* instead of to production. `NEXT_PUBLIC_SITE_URL` would
 * have to be right in three places and would be wrong on every preview, since
 * Vercel's preview hostname contains the branch name and changes.
 *
 * `x-forwarded-*` come first because that is what a proxy in front of the app
 * sets, and behind Vercel the bare `host` is the internal one.
 */
export async function siteOrigin(): Promise<string> {
  const headerList = await headers();

  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "127.0.0.1:3000";

  // Local development is the only case that is not HTTPS. Defaulting the
  // other way round would send Supabase an `http://` redirect for production,
  // which it rejects as not matching the allowlist.
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("127.0.0.1") || host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

/** Absolute URL for a path on this site. */
export async function absoluteUrl(path: string): Promise<string> {
  const origin = await siteOrigin();
  return new URL(path, origin).toString();
}

/**
 * Reduces a `next=` parameter to a path we are willing to redirect to.
 *
 * It accepts two shapes because two different senders produce it. Our own
 * sign-in page sends a relative path (`/fr/apprendre`). Supabase's email
 * templates interpolate `{{ .RedirectTo }}`, which is the absolute URL we
 * handed to `resetPasswordForEmail` — already checked against Supabase's own
 * redirect allowlist, but checked again here rather than trusted, because a
 * redirect target arriving through an email is exactly the input an
 * open-redirect lives in.
 *
 * Anything pointing at another origin returns `null`, and every caller
 * substitutes its own default.
 */
export async function sameOriginPath(
  value: string | null | undefined,
): Promise<string | null> {
  if (!value) return null;

  // Relative. `//evil.example` and `/\evil.example` are protocol-relative to a
  // browser, so a bare `startsWith("/")` is not enough on its own.
  if (value.startsWith("/")) {
    if (value.startsWith("//") || value.startsWith("/\\")) return null;
    return value;
  }

  const origin = await siteOrigin();
  try {
    const url = new URL(value);
    if (url.origin !== origin) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
