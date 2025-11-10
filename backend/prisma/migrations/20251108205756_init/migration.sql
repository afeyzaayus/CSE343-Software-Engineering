/*
  Warnings:

  - You are about to drop the `Announcements` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Announcements" DROP CONSTRAINT "Announcements_siteId_fkey";

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "reset_code" TEXT,
ADD COLUMN     "reset_code_expiry" TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."Announcements";

-- CreateTable
CREATE TABLE "public"."announcements" (
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
ALTER TABLE "public"."announcements" ADD CONSTRAINT "Announcements_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
