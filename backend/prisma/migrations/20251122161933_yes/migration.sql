-- CreateEnum
CREATE TYPE "public"."AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."AccountType" ADD VALUE 'MASTER_ADMIN';
ALTER TYPE "public"."AccountType" ADD VALUE 'COMPANY_MANAGER';
ALTER TYPE "public"."AccountType" ADD VALUE 'COMPANY_EMPLOYEE';
ALTER TYPE "public"."AccountType" ADD VALUE 'SITE_USER';

-- DropForeignKey
ALTER TABLE "public"."sites" DROP CONSTRAINT "sites_adminId_fkey";

-- AlterTable
ALTER TABLE "public"."admins" ADD COLUMN     "account_status" "public"."AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "last_login" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."sites" ADD COLUMN     "apartment_count" INTEGER,
ADD COLUMN     "block_count" INTEGER,
ADD COLUMN     "company_id" INTEGER,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "site_status" "public"."AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "adminId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "account_status" "public"."AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "last_login" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" SERIAL NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_code" TEXT NOT NULL,
    "account_status" "public"."AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "manager_id" INTEGER NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_employees" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."AccountStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "company_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_site_access" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "site_id" INTEGER NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_site_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invitations" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "invite_code" TEXT NOT NULL,
    "invite_link" TEXT NOT NULL,
    "invited_email" TEXT,
    "invited_by" INTEGER NOT NULL,
    "status" "public"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "used_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."complaints" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'PENDING',
    "siteId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_company_code_key" ON "public"."companies"("company_code");

-- CreateIndex
CREATE UNIQUE INDEX "company_employees_admin_id_key" ON "public"."company_employees"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_site_access_employee_id_site_id_key" ON "public"."employee_site_access"("employee_id", "site_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_invite_code_key" ON "public"."invitations"("invite_code");

-- AddForeignKey
ALTER TABLE "public"."companies" ADD CONSTRAINT "companies_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_employees" ADD CONSTRAINT "company_employees_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_employees" ADD CONSTRAINT "company_employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_site_access" ADD CONSTRAINT "employee_site_access_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."company_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_site_access" ADD CONSTRAINT "employee_site_access_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invitations" ADD CONSTRAINT "invitations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sites" ADD CONSTRAINT "sites_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sites" ADD CONSTRAINT "sites_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."complaints" ADD CONSTRAINT "complaints_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."complaints" ADD CONSTRAINT "complaints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
