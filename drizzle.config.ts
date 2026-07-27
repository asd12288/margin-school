import { defineConfig } from "drizzle-kit";

/**
 * Drizzle authors the schema; the Supabase CLI runs the migrations.
 *
 * `out` points at supabase/migrations so there is exactly ONE migration
 * history. Two migration systems in one repo is the classic Supabase +
 * Drizzle failure: `npm run db:reset` replays supabase/migrations and would
 * silently omit anything Drizzle kept in its own folder.
 *
 * `prefix: "supabase"` produces 20260727123900_name.sql rather than
 * 0000_name.sql — the Supabase runner requires the timestamp form.
 *
 * Only `generate` is ever run from here. Migrations are applied by
 * `supabase db reset` locally and `supabase db push` remotely, so no live
 * connection is needed for the normal workflow. See docs/environments.md.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/index.ts",
  out: "./supabase/migrations",
  migrations: { prefix: "supabase" },
  casing: "snake_case",
  strict: true,
  verbose: true,
  dbCredentials: {
    // Local Docker default. Not a secret — it is the fixed value the Supabase
    // CLI assigns to every local stack. Only used by commands that need a live
    // connection, which the normal workflow does not.
    url:
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL ??
      "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  },
});
