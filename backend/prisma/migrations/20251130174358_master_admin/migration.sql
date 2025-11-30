/*
  Warnings:

  - The values [SUPER_ADMIN] on the enum `MasterRole` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `master_users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `master_users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."MasterRole_new" AS ENUM ('MASTER_ADMIN', 'DEVELOPER');
ALTER TABLE "public"."master_users" ALTER COLUMN "master_role" DROP DEFAULT;
ALTER TABLE "public"."master_users" ALTER COLUMN "master_role" TYPE "public"."MasterRole_new" USING ("master_role"::text::"public"."MasterRole_new");
ALTER TYPE "public"."MasterRole" RENAME TO "MasterRole_old";
ALTER TYPE "public"."MasterRole_new" RENAME TO "MasterRole";
DROP TYPE "public"."MasterRole_old";
ALTER TABLE "public"."master_users" ALTER COLUMN "master_role" SET DEFAULT 'DEVELOPER';
COMMIT;

-- AlterTable
ALTER TABLE "public"."master_users" DROP CONSTRAINT "master_users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "master_users_pkey" PRIMARY KEY ("id");
