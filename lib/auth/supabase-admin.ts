import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * The privileged client. **Bypasses row-level security entirely.**
 *
 * Deliberately its own module with a loud name, rather than an option on
 * `createSupabaseServerClient`, so that every privileged call is visible as an
 * import in the file that makes it — the same reasoning that keeps Drizzle's
 * bypass separate in lib/db/client.ts.
 *
 * There is exactly one legitimate caller today: deleting a user. `auth.users`
 * belongs to Supabase Auth, and nothing but the admin API can remove a row
 * from it — a signed-in user cannot delete their own auth record with their
 * own token.
 *
 * No session, no cookies, no token refresh: this client is never acting as a
 * person, and persisting a session here would risk it leaking into a request
 * that should have been anonymous.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. Account deletion needs the admin API; see docs/environments.md.",
    );
  }

  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * A throwaway client for *checking* a credential, with no session of its own.
 *
 * Used by the change-password flow to confirm the caller knows their current
 * password. It must not be the cookie-bound client from
 * `createSupabaseServerClient`: `signInWithPassword` there is not a read, it is
 * a sign-in — it issues a fresh session and writes it over the caller's
 * cookies, as a side effect of what is meant to be a yes/no question.
 *
 * Publishable key, not the secret one: this is acting as the person signing
 * in, and nothing here needs to bypass row-level security.
 */
export function createSupabaseCheckClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        /**
         * Its own storage key, so this client shares nothing with the
         * cookie-bound one.
         *
         * `@supabase/auth-js` serialises auth calls behind a process-wide lock
         * named after the storage key, and every client that derives the same
         * key queues on the same lock. Nothing reads this key — the client
         * keeps no session — so the name only has to be distinct.
         */
        storageKey: "margin-school-password-check",
      },
    },
  );
}
