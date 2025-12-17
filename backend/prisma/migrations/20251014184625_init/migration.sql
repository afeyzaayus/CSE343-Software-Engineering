/*
  Warnings:

  - Added the required column `updated_at` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Site` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Site" DROP CONSTRAINT "Site_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_site_id_fkey";

-- AlterTable
ALTER TABLE "public"."Admin" ADD COLUMN     "active_site_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Site" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Admin" ADD CONSTRAINT "Admin_active_site_id_fkey" FOREIGN KEY ("active_site_id") REFERENCES "public"."Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Site" ADD CONSTRAINT "Site_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
