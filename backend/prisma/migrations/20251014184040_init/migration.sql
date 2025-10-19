-- CreateTable
CREATE TABLE "public"."Site" (
    "id" TEXT NOT NULL,
    "site_name" TEXT NOT NULL,
    "site_address" TEXT NOT NULL,
    "admin_id" INTEGER NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "block_no" TEXT NOT NULL,
    "apartment_no" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Admin" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "public"."Admin"("email");

-- AddForeignKey
ALTER TABLE "public"."Site" ADD CONSTRAINT "Site_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
