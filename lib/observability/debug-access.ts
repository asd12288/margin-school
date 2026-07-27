import "server-only";

/**
 * Gate for the observability debug surfaces.
 *
 * The debug panel deliberately works in every environment including
 * production — you cannot verify production monitoring from staging. It is
 * protected by a server-only shared secret rather than an environment
 * check, so it is usable where it matters and not discoverable by anyone
 * who does not already have the token.
 *
 * Token lives in OBSERVABILITY_DEBUG_TOKEN. If it is unset, the surfaces
 * are closed — fail shut, never open.
 */
export function hasDebugAccess(token: string | undefined | null): boolean {
  const expected = process.env.OBSERVABILITY_DEBUG_TOKEN;

  if (!expected || !token) return false;
  if (token.length !== expected.length) return false;

  // Constant-time-ish comparison; avoids leaking the token by timing.
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }

  return mismatch === 0;
}
