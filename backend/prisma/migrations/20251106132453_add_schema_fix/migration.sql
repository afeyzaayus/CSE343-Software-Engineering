/*
  Warnings:

  - You are about to drop the column `isVerified` on the `admins` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."admins" DROP COLUMN "isVerified",
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."social_amenities" (
    "id" TEXT NOT NULL,
    "siteId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Açık',
    "hours" TEXT,
    "rules" TEXT,
    "extra" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_amenities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."social_amenities" ADD CONSTRAINT "social_amenities_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
