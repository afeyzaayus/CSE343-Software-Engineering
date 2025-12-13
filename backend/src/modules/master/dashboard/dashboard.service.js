//  companies tablosundan tüm verilerin ACTIVE olanların sayısını döner
//  sites tablosundan tüm verilerin ACTIVE olanların sayısını döner
//  users tablosundan tüm verilerin ACTIVE olanların sayısını döner

//  tüm admins tablosundan kayıt tarihlerinden 1 sene sonrasına geri sayım yapınca 30 günden az kalanların hesap bilgilerini döner

// yıllık gelir hesaplama da admins tabslosundan INDIVIDUAL (200 tl - aylık) ve COMPANY (400 tl - aylık) türündeki kullanıcıların aylık ödemelerini toplayarak yıllık gelir hesaplanır ve döner


import prisma from '../../../prisma/prismaClient.js';

export async function getActiveCompanyCounts(){
    const activeCompanyCount = await prisma.companies.count({
        where: {
            account_status: 'ACTIVE'
        }
    });
    return activeCompanyCount;
}

export async function getActiveSiteCounts(){
    const activeSiteCount = await prisma.site.count({
        where: {
            site_status: 'ACTIVE'
        }
    });
    return activeSiteCount;
}

export async function getActiveUserCounts(){
    const activeUserCount = await prisma.user.count({
        where: {
            account_status: 'ACTIVE'
        }
    });
    return activeUserCount;
}

export async function getAdminsWithExpiringAccounts() {
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + 30);

    // Companies ve Individuals tablosundan expiry_date kontrolü
    const [companies, individuals] = await Promise.all([
        prisma.companies.findMany({
            where: {
                account_status: 'ACTIVE',
                expiry_date: {
                    gte: today,
                    lte: thresholdDate
                }
            },
            include: {
                admins: {
                    where: {
                        account_type: 'COMPANY_MANAGER',
                        account_status: 'ACTIVE'
                    },
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        account_type: true
                    }
                }
            }
        }),
        prisma.individuals.findMany({
            where: {
                account_status: 'ACTIVE',
                expiry_date: {
                    gte: today,
                    lte: thresholdDate
                }
            },
            include: {
                admin: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        account_type: true
                    }
                }
            }
        })
    ]);

    const expiringAdmins = [];

    // Company Manager'ları ekle
    companies.forEach(company => {
        company.admins.forEach(admin => {
            const diffMs = company.expiry_date.getTime() - today.getTime();
            const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            expiringAdmins.push({
                id: admin.id,
                full_name: admin.full_name,
                email: admin.email,
                account_type: admin.account_type,
                company_name: company.company_name,
                company_code: company.company_code,
                accountExpiryDate: company.expiry_date,
                daysRemaining
            });
        });
    });

    // Individual'ları ekle
    individuals.forEach(individual => {
        const diffMs = individual.expiry_date.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        expiringAdmins.push({
            id: individual.admin.id,
            full_name: individual.admin.full_name,
            email: individual.admin.email,
            account_type: individual.admin.account_type,
            company_name: null,
            company_code: null,
            accountExpiryDate: individual.expiry_date,
            daysRemaining
        });
    });

    return expiringAdmins.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export async function calculateAnnualRevenue() {
    const FEES = {
        INDIVIDUAL: 200,
        COMPANY: 400,
    };

    const [individualCount, companyCount] = await Promise.all([
        prisma.individuals.count({
            where: {
                account_status: 'ACTIVE',
            },
        }),
        prisma.companies.count({
            where: {
                account_status: 'ACTIVE',
            },
        }),
    ]);

    const monthlyRevenue =
        individualCount * FEES.INDIVIDUAL +
        companyCount * FEES.COMPANY;

    return monthlyRevenue * 12;
}

// Bugünden itibaren SON 30 gün içinde yapılan yeni kayıtlar
export async function getMonthlyNewRegistrations() {
    const now = new Date();
    const pastDate = new Date();
    pastDate.setDate(now.getDate() - 30);

    const total = await prisma.admin.count({
        where: {
            created_at: {
                gte: pastDate,
                lte: now
            }
        }
    });

    return total;
}
// Son 30 gün içinde kaydolan adminlerin detaylı listesi (Yeni Kayıtlar tab için)
export async function getRecentNewRegistrations() {
    // Türkiye saati için UTC+3
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - 30);
    
    // Günün başlangıcını almak için saati sıfırla (opsiyonel)
    pastDate.setHours(0, 0, 0, 0);
    
    console.log('Tarih aralığı:', {
        from: pastDate.toISOString(),
        to: now.toISOString(),
        fromLocal: pastDate.toLocaleString('tr-TR'),
        toLocal: now.toLocaleString('tr-TR')
    });

    const recentAdmins = await prisma.admin.findMany({
        where: {
            created_at: {
                gte: pastDate
                // lte kaldırıldı, gelecek tarihleri de dahil et
            }
        },
        select: {
            id: true,
            full_name: true,
            email: true,
            account_type: true,
            company_name: true,
            company_code: true,
            created_at: true,
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    console.log('Bulunan kayıtlar:', recentAdmins.length);
    
    return recentAdmins;
}

// Hesabın süresini uzat
export async function extendAccountSubscription(accountId, accountType, months = 12) {
    try {
        const admin = await prisma.admin.findUnique({
            where: { id: parseInt(accountId) },
            include: {
                company: true,
                individual: true
            }
        });

        if (!admin) {
            throw new Error('Hesap bulunamadı');
        }

        if (admin.account_type !== 'INDIVIDUAL' && admin.account_type !== 'COMPANY_MANAGER') {
            throw new Error('Bu hesap tipi için süre uzatma işlemi yapılamaz');
        }

        const today = new Date();
        let currentExpiryDate, newExpiryDate;

        if (admin.account_type === 'COMPANY_MANAGER' && admin.company) {
            currentExpiryDate = admin.company.expiry_date || new Date(admin.created_at);
            currentExpiryDate.setFullYear(currentExpiryDate.getFullYear() + 1);

            newExpiryDate = currentExpiryDate > today ? new Date(currentExpiryDate) : new Date(today);
            newExpiryDate.setMonth(newExpiryDate.getMonth() + months);

            await prisma.companies.update({
                where: { id: admin.company.id },
                data: {
                    expiry_date: newExpiryDate,
                    account_status: 'ACTIVE'
                }
            });

        } else if (admin.account_type === 'INDIVIDUAL' && admin.individual) {
            currentExpiryDate = admin.individual.expiry_date || new Date(admin.created_at);
            currentExpiryDate.setFullYear(currentExpiryDate.getFullYear() + 1);

            newExpiryDate = currentExpiryDate > today ? new Date(currentExpiryDate) : new Date(today);
            newExpiryDate.setMonth(newExpiryDate.getMonth() + months);

            await prisma.individuals.update({
                where: { id: admin.individual.id },
                data: {
                    expiry_date: newExpiryDate,
                    account_status: 'ACTIVE'
                }
            });
        }

        await prisma.admin.update({
            where: { id: parseInt(accountId) },
            data: {
                account_status: 'ACTIVE'
            }
        });

        return {
            success: true,
            message: `${admin.full_name} hesabının süresi ${months} ay uzatıldı`,
            admin: {
                id: admin.id,
                full_name: admin.full_name,
                email: admin.email,
                account_type: admin.account_type
            },
            oldExpiryDate: currentExpiryDate,
            newExpiryDate: newExpiryDate,
            extendedMonths: months
        };

    } catch (error) {
        console.error('Abonelik uzatma hatası:', error);
        throw error;
    }
}