import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";

/**
 * Locally this is the Docker Postgres from .env.local. On Vercel there is no
 * DATABASE_URL — the Supabase integration supplies POSTGRES_URL (pooled),
 * which is what serverless wants. One code path covers both.
 *
 * See docs/environments.md for the connection-string table.
 */
const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "No database connection string. Set DATABASE_URL locally (npm run db:start, then copy from `supabase status -o env`), or rely on POSTGRES_URL on Vercel.",
  );
}

function createClient() {
  return postgres(connectionString!, {
    // Required when talking to Supabase's pooler: prepared statements do not
    // survive a connection being handed to another client.
    prepare: false,
  });
}

/**
 * Dev reuses one client across hot reloads. Without this, every edit opens a
 * new pool and the local Postgres runs out of connections within minutes.
 */
const globalForDb = globalThis as unknown as {
  __marginSchoolDbClient?: ReturnType<typeof createClient>;
};

const client =
  globalForDb.__marginSchoolDbClient ??
  (globalForDb.__marginSchoolDbClient = createClient());

export const db = drizzle(client, { schema, casing: "snake_case" });

export type Database = typeof db;
