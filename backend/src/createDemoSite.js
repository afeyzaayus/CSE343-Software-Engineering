// Test script - Demo site oluştur

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDemoSite() {
    try {
        // Önce admin kontrolü - en az bir admin olmalı
        const admin = await prisma.admin.findFirst();
        
        if (!admin) {
            console.log('❌ Veritabanında admin bulunamadı! Önce admin oluşturun.');
            await prisma.$disconnect();
            return;
        }

        console.log(`✅ Admin bulundu: ${admin.full_name} (ID: ${admin.id})`);

        // Demo site var mı kontrol et
        const existingSite = await prisma.site.findUnique({
            where: { site_id: 'DEMO-SITE-001' }
        });

        if (existingSite) {
            console.log('\n✅ DEMO-SITE-001 zaten mevcut!');
            console.log(`Site Adı: ${existingSite.site_name}`);
            console.log(`Site ID: ${existingSite.site_id}`);
            await prisma.$disconnect();
            return;
        }

        // Demo site oluştur
        const newSite = await prisma.site.create({
            data: {
                site_id: 'DEMO-SITE-001',
                site_name: 'Demo Test Sitesi',
                site_address: 'İstanbul, Türkiye',
                adminId: admin.id
            }
        });

        console.log('\n✅ Demo site başarıyla oluşturuldu!');
        console.log(`Site ID: ${newSite.site_id}`);
        console.log(`Site Adı: ${newSite.site_name}`);
        console.log(`Admin ID: ${newSite.adminId}`);

        // Tüm siteleri listele
        const allSites = await prisma.site.findMany({
            select: {
                site_id: true,
                site_name: true
            }
        });

        console.log('\n=== TÜM SİTELER ===');
        allSites.forEach(site => {
            console.log(`- ${site.site_id}: ${site.site_name}`);
        });

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Hata:', error.message);
        await prisma.$disconnect();
    }
}

createDemoSite();
