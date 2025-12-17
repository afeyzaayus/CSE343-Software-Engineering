/*
  Warnings:

  - You are about to drop the column `verification_token` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "verification_token",
ADD COLUMN     "code_expiry" TIMESTAMP(3),
ADD COLUMN     "verification_code" TEXT;
