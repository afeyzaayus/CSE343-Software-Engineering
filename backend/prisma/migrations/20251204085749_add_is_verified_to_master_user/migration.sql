-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."MasterRole" ADD VALUE 'PRODUCT_OWNER';
ALTER TYPE "public"."MasterRole" ADD VALUE 'BOOKKEEPER';

-- AlterTable
ALTER TABLE "public"."master_users" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false;
