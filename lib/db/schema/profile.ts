import { pgEnum, pgSchema, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
 * Self-reported experience, asked once at onboarding.
 *
 * Deliberately the same three values as `Course.level` in
 * docs/content-model.md, so "what should this person read next" is a
 * comparison rather than a mapping table. Phase 12 is where that comparison
 * gets used; storing it now costs one column and saves asking everyone again
 * later.
 *
 * It is a starting point, not a score. Nothing in the UI renders it as a
 * badge — see the no-gamification rule in docs/design-system.md.
 */
export const experienceLevel = pgEnum("experience_level", [
  "beginner",
  "intermediate",
  "advanced",
]);

/**
 * Why they are here. Four answers, because a list long enough to need
 * scrolling stops being a quick question and starts being a form.
 *
 * These are the four things a beginner-first markets school can actually
 * deliver, phrased as outcomes rather than topics.
 */
export const learningGoal = pgEnum("learning_goal", [
  "understand_markets",
  "read_charts",
  "manage_risk",
  "build_strategy",
]);

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

  /* --- Onboarding ------------------------------------------------------
   * All four are nullable, and that is the point: a row exists from the
   * moment the signup trigger fires, before the person has answered
   * anything. `onboardedAt` is the only completion signal — a non-null
   * timestamp means they finished, and no combination of the other three
   * is read as "done". Inferring completion from "displayName is set"
   * would silently re-open onboarding for anyone who later clears a field.
   */

  /**
   * What we call them. Not a username: it is not unique, not an identifier,
   * and never appears in a URL. There are no public profiles and no social
   * surface (ADR-0002), so this is only ever shown back to its owner.
   */
  displayName: text("display_name"),
  experienceLevel: experienceLevel("experience_level"),
  goal: learningGoal("goal"),

  /** Non-null once onboarding is finished. The gate reads this and nothing else. */
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;
