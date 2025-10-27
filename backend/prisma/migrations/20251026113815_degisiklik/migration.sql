/*
  Warnings:

  - You are about to drop the column `is_verified` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `verification_token` on the `admins` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."admins" DROP COLUMN "is_verified",
DROP COLUMN "verification_token";
