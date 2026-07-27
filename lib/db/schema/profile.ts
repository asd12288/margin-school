import { pgEnum, pgSchema, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Supabase Auth owns `auth.users` — email, password hash, sessions, OAuth
 * links. We reference it and never write to it: its shape belongs to
 * Supabase and can change on their upgrades.
 *
 * Declared here only so the foreign key is expressed in TypeScript. The
 * generated migration must NOT contain DDL creating this schema or table —
 * see the review note in supabase/migrations.
 */
const authSchema = pgSchema("auth");
const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

/** `visitor` is not stored — a visitor has no profile row. */
export const userRole = pgEnum("user_role", ["student", "editor", "admin"]);

/** Launch locales. See docs/decisions/0009-french-english-day-one.md. */
export const userLocale = pgEnum("user_locale", ["fr", "en"]);

/**
 * Denormalised status, not a subscription object. The full `subscription`
 * table with Stripe ids arrives in Phase 10, when there is something to put
 * in it. Read only through the entitlement boundary — see
 * docs/decisions/0006-entitlement-boundary-before-billing.md.
 */
export const subscriptionStatus = pgEnum("subscription_status", [
  "none",
  "trialing",
  "active",
  "past_due",
  "canceled",
]);

/**
 * The application's own view of a person, sitting alongside the
 * authentication system's view. One row per user, created automatically by a
 * database trigger on signup.
 */
export const profile = pgTable("profile", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  role: userRole("role").notNull().default("student"),
  locale: userLocale("locale").notNull().default("fr"),
  subscriptionStatus: subscriptionStatus("subscription_status")
    .notNull()
    .default("none"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;
