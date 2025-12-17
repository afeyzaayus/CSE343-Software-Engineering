/*
  Warnings:

  - The values [COMPANY] on the enum `AccountType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."AccountType_new" AS ENUM ('INDIVIDUAL', 'MASTER_ADMIN', 'COMPANY_MANAGER', 'COMPANY_EMPLOYEE', 'SITE_USER');
ALTER TABLE "public"."admins" ALTER COLUMN "account_type" TYPE "public"."AccountType_new" USING ("account_type"::text::"public"."AccountType_new");
ALTER TYPE "public"."AccountType" RENAME TO "AccountType_old";
ALTER TYPE "public"."AccountType_new" RENAME TO "AccountType";
DROP TYPE "public"."AccountType_old";
COMMIT;
