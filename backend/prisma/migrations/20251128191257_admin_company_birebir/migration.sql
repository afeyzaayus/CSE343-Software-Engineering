/*
  Warnings:

  - You are about to drop the column `manager_id` on the `companies` table. All the data in the column will be lost.
  - Added the required column `companyId` to the `admins` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."companies" DROP CONSTRAINT "companies_manager_id_fkey";

-- AlterTable
ALTER TABLE "public"."admins" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."companies" DROP COLUMN "manager_id";

-- AddForeignKey
ALTER TABLE "public"."admins" ADD CONSTRAINT "admins_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
