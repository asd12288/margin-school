"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for the browser. Used **only** for auth actions —
 * sign in, sign out, OAuth redirects, password reset.
 *
 * It is never used to read application data. The browser does not query the
 * database; that goes through server components and server actions. See
 * docs/decisions/0003-tech-stack.md.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
