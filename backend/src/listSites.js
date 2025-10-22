// Test script - Veritabanındaki siteleri listele

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listSites() {
    try {
        const sites = await prisma.site.findMany({
            select: {
                id: true,
                site_id: true,
                site_name: true,
                site_address: true
            }
        });

        console.log('\n=== VERİTABANINDAKİ SİTELER ===\n');
        
        if (sites.length === 0) {
            console.log('Veritabanında hiç site yok!');
        } else {
            sites.forEach(site => {
                console.log(`ID: ${site.id}`);
                console.log(`Site ID: ${site.site_id}`);
                console.log(`Site Adı: ${site.site_name}`);
                console.log(`Adres: ${site.site_address}`);
                console.log('-------------------');
            });
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('Hata:', error);
        await prisma.$disconnect();
    }
}

listSites();
