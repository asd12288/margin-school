import "server-only";

import { headers } from "next/headers";

import { isProduction } from "@/lib/env";

/**
 * The hostnames this deployment answers to, as the platform reports them.
 *
 * Vercel sets all three itself, and a request cannot influence them. That is
 * what makes them usable as an allowlist for `x-forwarded-host`, which is a
 * header and therefore data.
 *
 *   `VERCEL_PROJECT_PRODUCTION_URL`  the production domain — becomes the
 *                                    custom domain the day one is attached
 *   `VERCEL_BRANCH_URL`              `margin-school-git-<branch>-<team>…`
 *   `VERCEL_URL`                     the per-deployment hostname
 *
 * Empty anywhere that is not Vercel, and that emptiness is load-bearing —
 * see `resolveHost`.
 */
function platformHosts(): string[] {
  return [
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
  ].filter((host): host is string => Boolean(host));
}

/**
 * The host to use when the requested one is not one of ours.
 *
 * Production has a stable domain and every emailed link should carry it. A
 * preview has no such thing, so its own branch hostname is the best available
 * — and pointing a preview's links at production would recreate exactly the
 * bug `absoluteUrl` exists to avoid.
 */
function canonicalHost(fallback: string[]): string {
  const preferred = isProduction
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : (process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL);

  return preferred ?? fallback[0]!;
}

/**
 * The requested host, if we answer to it; the canonical one otherwise.
 *
 * Worth being precise about what this defends against, because it is not the
 * open door it looks like. Vercel does not let a client send
 * `x-forwarded-host` to a function — it sets the header itself — and every
 * `redirectTo` we build from this is checked again by Supabase against the
 * project's redirect allowlist before it is ever put in an email. So this is
 * the third lock on that door, not the first.
 *
 * It earns its place by not depending on either of the other two: a proxy in
 * front of Vercel, a move off Vercel, or someone widening
 * `additional_redirect_urls` in supabase/config.toml all quietly remove one,
 * and none of them would remove this. It fails to the canonical host rather
 * than throwing, so the worst case is a link to the right site.
 */
function resolveHost(requested: string): string {
  const allowed = platformHosts();

  // Not on Vercel: local development, and the e2e suite on port 3100. There is
  // no proxy in front and no platform value to compare against, so the request
  // is the only source there is — which is also why the ports vary freely.
  if (allowed.length === 0) return requested;

  // Platform values never carry a port, so compare bare hostnames.
  const hostname = requested.split(":")[0]!;

  return allowed.includes(hostname) ? requested : canonicalHost(allowed);
}

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

  const requested = (
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "127.0.0.1:3000"
  ).toLowerCase();

  const host = resolveHost(requested);

  // Local development is the only case that is not HTTPS. Defaulting the
  // other way round would send Supabase an `http://` redirect for production,
  // which it rejects as not matching the allowlist.
  //
  // `x-forwarded-proto` is only trusted for a host we just vouched for —
  // otherwise a spoofed pair could downgrade a canonical origin to http and
  // Supabase would reject the redirect as not matching the allowlist.
  const protocol =
    (host === requested ? headerList.get("x-forwarded-proto") : null) ??
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
