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

const USERS = [
  { email: TEST_EMAILS.student, role: "student" as const },
  { email: TEST_EMAILS.editor, role: "editor" as const },
];

const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const { email, role } of USERS) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  // Already seeded is success, not failure — this script is re-run constantly.
  if (error && !error.message.toLowerCase().includes("already")) {
    throw error;
  }

  const id =
    data?.user?.id ??
    (await admin.auth.admin.listUsers()).data.users.find((u) => u.email === email)?.id;

  if (!id) throw new Error(`Could not resolve a user id for ${email}`);

  // The signup trigger creates the profile with role 'student'; only the
  // editor needs changing.
  const { error: roleError } = await admin
    .from("profile")
    .update({ role })
    .eq("id", id);

  if (roleError) throw roleError;

  console.log(`seeded ${email} as ${role}`);
}
