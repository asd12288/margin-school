import { createClient } from "@supabase/supabase-js";

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

if (!url.includes("127.0.0.1") && !url.includes("localhost")) {
  throw new Error(`Refusing to seed test users against a non-local Supabase: ${url}`);
}

export const TEST_PASSWORD = "test-password-123";

const USERS = [
  { email: "student@test.local", role: "student" as const },
  { email: "editor@test.local", role: "editor" as const },
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
