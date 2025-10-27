import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('Veritabanı tabloları kontrol ediliyor...\n');
    
    // Raw SQL ile tabloları kontrol et
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('Mevcut tablolar:');
    console.log(tables);
    
    // Announcements tablosunu kontrol et
    const hasAnnouncements = tables.some(t => t.table_name === 'announcements');
    
    if (hasAnnouncements) {
      console.log('\n✅ announcements tablosu mevcut');
      
      // Kayıt sayısını kontrol et
      const count = await prisma.announcement.count();
      console.log(`📊 Toplam duyuru sayısı: ${count}`);
    } else {
      console.log('\n❌ announcements tablosu BULUNAMADI!');
      console.log('Migration gerekiyor...');
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
