DO $$ BEGIN
 CREATE TYPE "gender" AS ENUM('MALE', 'FEMALE', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "hotel_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "price_range" AS ENUM('LOW', 'MID', 'HIGH');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "role" AS ENUM('USER', 'ADMIN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"hotel_id" uuid,
	"user_id" uuid,
	"message" text NOT NULL,
	"is_read" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hotels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"price_range" "price_range",
	"status" "hotel_status" DEFAULT 'PENDING' NOT NULL,
	"phone_contact" varchar(20),
	"email_contact" varchar(255),
	"website_link" text,
	"whatsapp_link" text,
	"images" text[],
	"videos" text[],
	"created_by" uuid NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firebase_uid" varchar(255) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"username" varchar(50) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"gender" "gender",
	"birth_date" timestamp,
	"role" "role" DEFAULT 'USER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "is_read_idx" ON "admin_notifications" ("is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "created_at_idx" ON "admin_notifications" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "status_idx" ON "hotels" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "created_by_idx" ON "hotels" ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_idx" ON "hotels" ("latitude","longitude");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_idx" ON "hotels" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_hotel" ON "reviews" ("user_id","hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hotel_id_idx" ON "reviews" ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "reviews" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_number_idx" ON "users" ("phone_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "username_idx" ON "users" ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "firebase_uid_idx" ON "users" ("firebase_uid");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hotels" ADD CONSTRAINT "hotels_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
