import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for server components, server actions and route handlers.
 *
 * Uses the **publishable** key, not the secret one: this client acts as the
 * signed-in user, so row-level security applies. Anything needing to bypass
 * RLS goes through Drizzle in `lib/db/client.ts` instead, deliberately, so
 * privileged access is always visible in the code.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies. That is fine: the proxy
            // refreshes the session on every request, so the browser's cookies
            // are already current by the time we render. Swallowing this is
            // the documented pattern, not a shortcut.
          }
        },
      },
    },
  );
}
