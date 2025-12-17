/*
  Warnings:

  - The values [MASTER_ADMIN] on the enum `AccountType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Announcements` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM ('MAINTENANCE', 'COMPLAINT', 'REQUEST', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."MasterRole" AS ENUM ('SUPER_ADMIN', 'DEVELOPER');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."AccountType_new" AS ENUM ('INDIVIDUAL', 'COMPANY_MANAGER', 'COMPANY_EMPLOYEE', 'SITE_USER');
ALTER TABLE "public"."admins" ALTER COLUMN "account_type" TYPE "public"."AccountType_new" USING ("account_type"::text::"public"."AccountType_new");
ALTER TYPE "public"."AccountType" RENAME TO "AccountType_old";
ALTER TYPE "public"."AccountType_new" RENAME TO "AccountType";
DROP TYPE "public"."AccountType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Announcements" DROP CONSTRAINT "Announcements_siteId_fkey";

-- AlterTable
ALTER TABLE "public"."admins" ADD COLUMN     "company_code" TEXT;

-- AlterTable
ALTER TABLE "public"."complaints" ADD COLUMN     "category" "public"."Category" DEFAULT 'MAINTENANCE';

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

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."master_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "master_role" "public"."MasterRole" NOT NULL DEFAULT 'DEVELOPER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "master_users_email_key" ON "public"."master_users"("email");

-- AddForeignKey
ALTER TABLE "public"."announcements" ADD CONSTRAINT "Announcements_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
