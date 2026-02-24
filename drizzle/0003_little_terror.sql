ALTER TYPE "gender" ADD VALUE 'OTHER';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "birth_date" SET DATA TYPE timestamp;