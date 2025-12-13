-- AlterTable
ALTER TABLE "public"."admins" ADD COLUMN     "individualId" INTEGER;

-- CreateTable
CREATE TABLE "public"."individuals" (
    "id" SERIAL NOT NULL,
    "site_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "account_status" "public"."AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "individuals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "individuals_site_id_key" ON "public"."individuals"("site_id");

-- CreateIndex
CREATE UNIQUE INDEX "individuals_admin_id_key" ON "public"."individuals"("admin_id");

-- AddForeignKey
ALTER TABLE "public"."individuals" ADD CONSTRAINT "individuals_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."individuals" ADD CONSTRAINT "individuals_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
