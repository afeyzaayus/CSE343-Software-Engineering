/*
  Warnings:

  - You are about to drop the `Site` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `announcements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `site_fees` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `social_amenities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_fees` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `site_id` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `account_type` on the `Admin` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."Site" DROP CONSTRAINT "Site_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_site_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."announcements" DROP CONSTRAINT "announcements_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."announcements" DROP CONSTRAINT "announcements_site_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."requests" DROP CONSTRAINT "requests_site_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."requests" DROP CONSTRAINT "requests_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."site_fees" DROP CONSTRAINT "site_fees_site_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_amenities" DROP CONSTRAINT "social_amenities_site_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_fees" DROP CONSTRAINT "user_fees_site_fee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_fees" DROP CONSTRAINT "user_fees_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."Admin" ADD COLUMN     "site_id" TEXT NOT NULL,
DROP COLUMN "account_type",
ADD COLUMN     "account_type" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."Site";

-- DropTable
DROP TABLE "public"."announcements";

-- DropTable
DROP TABLE "public"."requests";

-- DropTable
DROP TABLE "public"."site_fees";

-- DropTable
DROP TABLE "public"."social_amenities";

-- DropTable
DROP TABLE "public"."user_fees";

-- DropEnum
DROP TYPE "public"."AdminAccountType";

-- DropEnum
DROP TYPE "public"."RequestStatus";
