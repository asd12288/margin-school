/**
 * Single source of truth for which environment the app is running in.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_APP_ENV      — explicit, set by us (.env.local, Vercel)
 *   2. NEXT_PUBLIC_VERCEL_ENV   — set automatically by Vercel
 *   3. 'local'                  — fallback
 *
 * The `process.env.X` reads must stay literal: Next inlines NEXT_PUBLIC_*
 * at build time by static analysis, so they cannot be computed dynamically.
 *
 * See docs/environments.md.
 */

export type AppEnv = "local" | "preview" | "production";

function resolveAppEnv(): AppEnv {
  const explicit = process.env.NEXT_PUBLIC_APP_ENV;
  if (explicit === "local" || explicit === "preview" || explicit === "production") {
    return explicit;
  }

  // Vercel sets 'development' | 'preview' | 'production'
  const vercel = process.env.NEXT_PUBLIC_VERCEL_ENV;
  if (vercel === "production") return "production";
  if (vercel === "preview") return "preview";

  return "local";
}

export const APP_ENV: AppEnv = resolveAppEnv();

export const isProduction = APP_ENV === "production";
export const isPreview = APP_ENV === "preview";
export const isLocal = APP_ENV === "local";

/**
 * Release identifier, used by Sentry to group errors by deploy.
 * Vercel exposes the git SHA; locally there is no release.
 */
export const RELEASE =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || undefined;
