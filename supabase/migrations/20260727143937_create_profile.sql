CREATE TYPE "public"."subscription_status" AS ENUM('none', 'trialing', 'active', 'past_due', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."user_locale" AS ENUM('fr', 'en');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'editor', 'admin');--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"locale" "user_locale" DEFAULT 'fr' NOT NULL,
	"subscription_status" "subscription_status" DEFAULT 'none' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;