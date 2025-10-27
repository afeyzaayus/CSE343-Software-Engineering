import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function checkSites() {
  try {
    console.log('\n=== VERİTABANI SİTE KONTROLÜ ===\n');
    
    // Tüm siteleri getir
    const sites = await prisma.site.findMany({
      select: {
        id: true,
        site_id: true,
        site_name: true,
        site_address: true,
        adminId: true
      }
    });

    if (sites.length === 0) {
      console.log('❌ Veritabanında hiç site bulunamadı!\n');
    } else {
      console.log(`✅ Toplam ${sites.length} site bulundu:\n`);
      
      sites.forEach((site, index) => {
        console.log(`${index + 1}. Site:`);
        console.log(`   - ID (numeric): ${site.id}`);
        console.log(`   - Site ID: "${site.site_id}"`);
        console.log(`   - Site ID uzunluğu: ${site.site_id.length}`);
        console.log(`   - Site ID byte array: [${Buffer.from(site.site_id).join(', ')}]`);
        console.log(`   - Site Adı: ${site.site_name}`);
        console.log(`   - Adres: ${site.site_address}`);
        console.log(`   - Admin ID: ${site.adminId}`);
        console.log('');
      });
    }

    // Test: AAAAAA site_id ile arama
    console.log('\n=== "AAAAAA" İLE ARAMA TESTİ ===\n');
    
    const testSiteId = 'AAAAAA';
    console.log(`Aranan site_id: "${testSiteId}"`);
    console.log(`Aranan site_id uzunluğu: ${testSiteId.length}`);
    console.log(`Aranan site_id byte array: [${Buffer.from(testSiteId).join(', ')}]`);
    
    const foundSite = await prisma.site.findUnique({
      where: { site_id: testSiteId }
    });

    if (foundSite) {
      console.log('\n✅ Site BULUNDU!');
      console.log(`   - Site Adı: ${foundSite.site_name}`);
    } else {
      console.log('\n❌ Site BULUNAMADI!');
      console.log('\nOlası sebepler:');
      console.log('1. site_id değeri tam olarak "AAAAAA" değil');
      console.log('2. Başında veya sonunda boşluk karakteri var');
      console.log('3. Büyük/küçük harf farklı');
      console.log('4. Farklı karakterler kullanılmış (örn: Türkçe A)');
    }

  } catch (error) {
    console.error('\n❌ HATA:', error.message);
    console.error('Detay:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSites();
