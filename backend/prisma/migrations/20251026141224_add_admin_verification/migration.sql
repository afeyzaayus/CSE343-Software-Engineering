-- CreateTable
CREATE TABLE "public"."AdminVerification" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "company_name" TEXT,
    "verification_token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminVerification_email_key" ON "public"."AdminVerification"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminVerification_verification_token_key" ON "public"."AdminVerification"("verification_token");
