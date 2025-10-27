import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function updateSiteId() {
  try {
    console.log('Mevcut site bilgileri:');
    const sites = await prisma.site.findMany();
    console.log(sites);

    if (sites.length > 0) {
      console.log('\nSite ID güncelleniyor...');
      
      const updated = await prisma.site.update({
        where: { id: sites[0].id },
        data: { site_id: 'DEMO-SITE-001' }
      });

      console.log('\n✅ Site ID başarıyla güncellendi!');
      console.log('Yeni site bilgisi:', updated);
    }
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSiteId();
