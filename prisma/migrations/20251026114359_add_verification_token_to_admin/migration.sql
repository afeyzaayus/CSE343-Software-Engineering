/*
  Warnings:

  - A unique constraint covering the columns `[verification_token]` on the table `admins` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."admins" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verification_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "admins_verification_token_key" ON "public"."admins"("verification_token");
