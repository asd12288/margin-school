CREATE TYPE "public"."experience_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."learning_goal" AS ENUM('understand_markets', 'read_charts', 'manage_risk', 'build_strategy');--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "experience_level" "experience_level";--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "goal" "learning_goal";--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "onboarded_at" timestamp with time zone;