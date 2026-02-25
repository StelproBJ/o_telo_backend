DO $$ BEGIN
 CREATE TYPE "notification_type" AS ENUM('REJECTION', 'WARNING', 'SUSPENSION', 'INFO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_user_id" uuid,
	"target_hotel_id" uuid,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"message" text NOT NULL,
	"is_read" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "admin_password" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "warning_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_suspended" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_log_admin_id_idx" ON "admin_logs" ("admin_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_log_created_at_idx" ON "admin_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_user_id_idx" ON "notifications" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_is_read_idx" ON "notifications" ("is_read");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_target_hotel_id_hotels_id_fk" FOREIGN KEY ("target_hotel_id") REFERENCES "hotels"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
