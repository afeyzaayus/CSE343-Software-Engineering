/*
  Warnings:

  - You are about to drop the column `is_verified` on the `admins` table. All the data in the column will be lost.
  - Made the column `verification_token` on table `admins` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."admins" DROP COLUMN "is_verified",
ALTER COLUMN "verification_token" SET NOT NULL;
