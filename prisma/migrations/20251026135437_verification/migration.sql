/*
  Warnings:

  - You are about to drop the column `code_expiry` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `verification_code` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[verification_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "code_expiry",
DROP COLUMN "verification_code",
ADD COLUMN     "verification_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_verification_token_key" ON "public"."users"("verification_token");
