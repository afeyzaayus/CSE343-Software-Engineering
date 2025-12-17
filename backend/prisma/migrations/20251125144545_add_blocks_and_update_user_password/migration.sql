/*
  Warnings:

  - You are about to drop the column `is_verified` on the `users` table. All the data in the column will be lost.
  - Made the column `phone_number` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "is_verified",
ADD COLUMN     "block_id" INTEGER,
ADD COLUMN     "is_password_set" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "phone_number" SET NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."blocks" (
    "id" SERIAL NOT NULL,
    "block_name" TEXT NOT NULL,
    "site_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blocks_site_id_block_name_key" ON "public"."blocks"("site_id", "block_name");

-- AddForeignKey
ALTER TABLE "public"."blocks" ADD CONSTRAINT "blocks_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
