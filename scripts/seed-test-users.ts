import { createClient } from "@supabase/supabase-js";
import { TEST_EMAILS, TEST_PASSWORD } from "./test-users.ts";

/**
 * Seeds two users in the **local** stack for end-to-end tests.
 *
 * Refuses to run against anything but localhost. The service key bypasses row
 * level security entirely, and a script that creates known-password accounts
 * is exactly the thing that must never point at a real project.
 *
 * Run: npm run db:seed:test
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (see .env.local).");
}

// This script writes accounts with a known password using a key that
// ignores row level security, so the one thing it must never do is run
// against a real project. A substring check on the whole URL is not enough
// to guarantee that: `https://127.0.0.1.evil-project.supabase.co` is a real
// remote host whose name merely contains "127.0.0.1", and
// `https://prod-ref.supabase.co/?ref=localhost` satisfies it purely because
// of its query string. Only an exact match on the parsed hostname is safe.
const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

let hostname: string;
try {
  hostname = new URL(url).hostname;
} catch {
  throw new Error(`Refusing to seed test users: could not parse Supabase URL: ${url}`);
}

if (!LOCAL_HOSTNAMES.has(hostname)) {
  throw new Error(`Refusing to seed test users against a non-local Supabase: ${url}`);
}

/**
 * `onboarded: false` is not an oversight — see the note on
 * `TEST_EMAILS.newcomer`. Everyone else is marked finished, because
 * onboarding blocks every signed-in route and an un-onboarded fixture would
 * land every test on `/onboarding` instead of the page it meant to open.
 */
const USERS = [
  { email: TEST_EMAILS.student, role: "student" as const, onboarded: true },
  { email: TEST_EMAILS.editor, role: "editor" as const, onboarded: true },
  { email: TEST_EMAILS.admin, role: "admin" as const, onboarded: true },
  { email: TEST_EMAILS.newcomer, role: "student" as const, onboarded: false },
];

const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Finds an existing user by email, across every page.
 *
 * `listUsers()` returns the **first page only** — fifty users — and the
 * un-paginated version of this lookup worked for exactly as long as the local
 * stack held fewer than that. Every journey test creates an account and none
 * of them clean up, so a database that has run the suite a few times has
 * hundreds, the four fixtures fall off page one, and seeding dies with
 * "Could not resolve a user id" while the accounts are sitting right there.
 *
 * The failure is worse than it sounds: the fixtures exist, so the obvious
 * reading — "seeding did not work" — sends you looking in the wrong place.
 */
async function findUserIdByEmail(email: string): Promise<string | undefined> {
  const perPage = 200;

  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find((u) => u.email === email);
    if (match) return match.id;

    // A short page is the last page.
    if (data.users.length < perPage) return undefined;
  }
}

for (const { email, role, onboarded } of USERS) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  // Already seeded is success, not failure — this script is re-run constantly.
  if (error && !error.message.toLowerCase().includes("already")) {
    throw error;
  }

  const id = data?.user?.id ?? (await findUserIdByEmail(email));

  if (!id) throw new Error(`Could not resolve a user id for ${email}`);

  // The signup trigger creates the profile with role 'student' and every
  // onboarding column null. This fills in the rest.
  const { error: profileError } = await admin
    .from("profile")
    .update({
      role,
      // Written in both directions, never left alone. This script is re-run
      // constantly against accounts that already exist, and a branch that
      // only *set* the onboarding fields would leave the un-onboarded fixture
      // permanently onboarded the first time anyone completed the form as
      // them by hand — quietly disabling the test that proves the gate works.
      display_name: onboarded ? email.split("@")[0] : null,
      experience_level: onboarded ? "beginner" : null,
      goal: onboarded ? "understand_markets" : null,
      onboarded_at: onboarded ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (profileError) throw profileError;

  console.log(`seeded ${email} as ${role}${onboarded ? "" : " (not onboarded)"}`);
}
