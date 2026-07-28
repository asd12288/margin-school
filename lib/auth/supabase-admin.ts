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
