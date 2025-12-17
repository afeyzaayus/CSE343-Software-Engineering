-- DropForeignKey
ALTER TABLE "public"."admins" DROP CONSTRAINT "admins_companyId_fkey";

-- AlterTable
ALTER TABLE "public"."admins" ALTER COLUMN "companyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."admins" ADD CONSTRAINT "admins_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
