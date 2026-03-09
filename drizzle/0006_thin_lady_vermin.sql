ALTER TABLE "hotels" ADD COLUMN "rejection_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "hotels" ADD COLUMN "locked" integer DEFAULT 0 NOT NULL;