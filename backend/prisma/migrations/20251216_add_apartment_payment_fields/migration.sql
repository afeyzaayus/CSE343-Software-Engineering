-- Apartment bazlı ödeme sistemi
-- monthlyDues tablosuna apartment_id ve paid_by_user_id alanları ekle

ALTER TABLE "public"."monthlyDues" ADD COLUMN "apartment_id" INTEGER;
ALTER TABLE "public"."monthlyDues" ADD COLUMN "paid_by_user_id" INTEGER;

-- Yabancı anahtar ilişkilerini ekle
ALTER TABLE "public"."monthlyDues" ADD CONSTRAINT "monthlyDues_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;
ALTER TABLE "public"."monthlyDues" ADD CONSTRAINT "monthlyDues_paid_by_user_id_fkey" FOREIGN KEY ("paid_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- Mevcut verileri güncelle (varsa): userId'den apartment_id'yi al
UPDATE "public"."monthlyDues" m
SET "apartment_id" = (
  SELECT "apartment_id" FROM "public"."users" WHERE "id" = m."userId"
)
WHERE "apartment_id" IS NULL;
