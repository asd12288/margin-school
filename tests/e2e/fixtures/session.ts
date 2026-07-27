import { test as base, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * A real Supabase session, without any sign-in UI.
 *
 * Phase 3 builds the shell; Phase 4 builds the forms. That would leave the
 * signed-in header and the admin gate — the two riskiest things here —
 * untested, so the fixture signs in through supabase-js and writes the same
 * cookie `@supabase/ssr` would have written. It is a real token validated by
 * the real auth server, not a fake.
 *
 * The cookie shape below was **not** guessed — it was read out of
 * `@supabase/ssr`'s installed source (`node_modules/@supabase/ssr`) and
 * `@supabase/supabase-js`'s (`node_modules/@supabase/supabase-js/src/SupabaseClient.ts`):
 *
 * - The cookie name is `sb-<ref>-auth-token`, where `<ref>` is
 *   `new URL(supabaseUrl).hostname.split(".")[0]` — the default `storageKey`
 *   `SupabaseClient`'s constructor computes when the app doesn't pass a custom
 *   one (this app's clients, `lib/auth/supabase-server.ts` and `proxy.ts`,
 *   don't). For the local stack's `http://127.0.0.1:54321` that hostname is
 *   `127.0.0.1`, so the ref is `127`.
 * - The value is `base64-` followed by the JSON session object encoded with
 *   `@supabase/ssr`'s own base64url alphabet (`utils/base64url.js`), which is
 *   byte-for-byte what `Buffer.from(json).toString("base64url")` produces —
 *   both are unpadded RFC 4648 base64url. That prefix and encoding come from
 *   `cookies.js`'s `setItem`, gated on `cookieEncoding === "base64url"`,
 *   which is the default for both `createServerClient` and
 *   `createBrowserClient`.
 * - The JSON payload only needs `access_token`, `refresh_token` and
 *   `expires_at` — `GoTrueClient#_isValidSession` in `@supabase/auth-js`
 *   checks exactly those three keys before trusting a stored session.
 *   `token_type` and `user` are included too since a real cookie carries them.
 */
// Named SUPABASE_URL/SUPABASE_KEY, not URL/KEY: a module-scope `const URL`
// shadows the global `URL` constructor used below to parse it.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const PASSWORD = "test-password-123";

const EMAIL = {
  student: "student@test.local",
  editor: "editor@test.local",
} as const;

export type TestRole = keyof typeof EMAIL;

export const test = base.extend<{ signInAs: (role: TestRole) => Promise<void> }>({
  signInAs: async ({ context, baseURL }, use) => {
    // Playwright's fixture API, not React's `use()`. eslint-plugin-react-hooks
    // matches on the identifier name alone and can't tell the two apart.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(async (role) => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: EMAIL[role],
        password: PASSWORD,
      });

      if (error || !data.session) {
        throw new Error(
          `Could not sign in as ${role}. Run \`npm run db:seed:test\` first. ${error?.message ?? ""}`
        );
      }

      // The project ref is the first label of the Supabase host; locally
      // that's "127" (from "127.0.0.1"). See the module doc comment above for
      // how every part of this was verified against @supabase/ssr's source.
      const ref = new URL(SUPABASE_URL).hostname.split(".")[0];
      const value = JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        token_type: data.session.token_type,
        user: data.session.user,
      });

      await context.addCookies([
        {
          name: `sb-${ref}-auth-token`,
          value: `base64-${Buffer.from(value).toString("base64url")}`,
          url: baseURL ?? "http://127.0.0.1:3100",
        },
      ]);
    });
  },
});

export { expect };
