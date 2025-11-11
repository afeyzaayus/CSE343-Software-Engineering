/*
  Warnings:

  - You are about to drop the column `is_verified` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the `AdminVerification` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[verificationToken]` on the table `admins` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."admins" DROP COLUMN "is_verified",
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tokenExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT;

-- DropTable
DROP TABLE "public"."AdminVerification";

-- CreateIndex
CREATE UNIQUE INDEX "admins_verificationToken_key" ON "public"."admins"("verificationToken");
