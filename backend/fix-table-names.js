import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function renameTables() {
  try {
    console.log('Tablo isimleri düzeltiliyor...\n');
    
    // Announcements -> announcements
    await prisma.$executeRaw`ALTER TABLE IF EXISTS "public"."Announcements" RENAME TO "announcements"`;
    console.log('✅ Announcements -> announcements');
    
    console.log('\n✅ Tüm tablo isimleri düzeltildi!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

renameTables();
