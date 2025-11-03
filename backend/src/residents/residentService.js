// backend/src/residents/residentService.js

import prisma from '../prismaClient.js';

/**
 * Bir sitedeki tüm sakinleri (user rolündeki) listeler.
 * @param {string} site_id - Sitenin benzersiz ID'si
 */
export async function getAllResidentsBySiteService(site_id) {
    const site = await prisma.site.findUnique({ where: { site_id } });
    if (!site) {
        throw new Error('Site bulunamadı.');
    }

    const residents = await prisma.user.findMany({
        where: {
            siteId: site.id,
            role: 'USER' // Sadece 'user' rolündekileri getiriyoruz
        },
        select: {
            id: true,
            full_name: true,
            email: true,
            apartment: true,
            vehicle: true
        }
    });

    // Frontend'in beklediği formata dönüştür (fullName)
    return residents.map(r => ({
        id: r.id,
        fullName: r.full_name,
        email: r.email,
        apartment: r.apartment,
        vehicle: r.vehicle
    }));
}

/**
 * Bir sakinin bilgilerini günceller.
 * @param {string} site_id - Sitenin benzersiz ID'si
 * @param {string} userId - Güncellenecek kullanıcının ID'si
 * @param {object} data - Güncellenecek veriler { apartment, vehicle }
 */
export async function updateResidentDetailsService(site_id, userId, data) {
    const site = await prisma.site.findUnique({ where: { site_id } });
    if (!site) {
        throw new Error('Site bulunamadı.');
    }

    const user = await prisma.user.findFirst({
        where: { id: parseInt(userId), siteId: site.id }
    });

    if (!user) {
        throw new Error('Sakin bulunamadı veya bu siteye ait değil.');
    }

    const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
            apartment: data.apartment,
            vehicle: data.vehicle
        },
        select: {
            id: true,
            full_name: true,
            apartment: true,
            vehicle: true
        }
    });

    // Frontend'in beklediği formata dönüştür
    return {
        id: updatedUser.id,
        fullName: updatedUser.full_name,
        apartment: updatedUser.apartment,
        vehicle: updatedUser.vehicle
    };
}