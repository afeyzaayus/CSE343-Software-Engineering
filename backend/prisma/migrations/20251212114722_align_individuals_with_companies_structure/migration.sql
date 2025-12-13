-- DropForeignKey
ALTER TABLE "public"."individuals" DROP CONSTRAINT "individuals_site_id_fkey";

-- AlterTable
ALTER TABLE "public"."individuals" ALTER COLUMN "site_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."individuals" ADD CONSTRAINT "individuals_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
