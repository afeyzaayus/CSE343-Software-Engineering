-- AlterTable
ALTER TABLE "public"."master_users" ADD COLUMN     "tokenExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT;
