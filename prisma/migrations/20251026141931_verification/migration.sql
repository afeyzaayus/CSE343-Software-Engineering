/*
  Warnings:

  - You are about to drop the column `createdAt` on the `AdminVerification` table. All the data in the column will be lost.
  - You are about to drop the column `verification_token` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the `announcements` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `token_expiry` to the `AdminVerification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."announcements" DROP CONSTRAINT "announcements_siteId_fkey";

-- DropIndex
DROP INDEX "public"."admins_verification_token_key";

-- AlterTable
ALTER TABLE "public"."AdminVerification" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "token_expiry" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."admins" DROP COLUMN "verification_token",
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "public"."announcements";

-- CreateTable
CREATE TABLE "public"."Announcements" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "siteId" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Announcements" ADD CONSTRAINT "Announcements_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
