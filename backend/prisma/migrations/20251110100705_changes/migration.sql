-- AlterTable
ALTER TABLE "public"."announcements" RENAME CONSTRAINT "Announcements_pkey" TO "announcements_pkey";

-- RenameForeignKey
ALTER TABLE "public"."announcements" RENAME CONSTRAINT "Announcements_siteId_fkey" TO "announcements_siteId_fkey";
