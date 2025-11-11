/*
  Warnings:

  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `verification_token` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."users_email_key";

-- DropIndex
DROP INDEX "public"."users_verification_token_key";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "email",
DROP COLUMN "verification_token",
ADD COLUMN     "code_expiry" TIMESTAMP(3),
ADD COLUMN     "phone_verification_code" TEXT;
