import {
    getActiveCompanyCounts,
    getActiveSiteCounts,
    getActiveUserCounts,
    getAdminsWithExpiringAccounts,
    calculateAnnualRevenue,
    getMonthlyNewRegistrations,
    getRecentNewRegistrations,
    extendAccountSubscription
} from './dashboard.service.js';

export async function fetchDashboardMetrics(req, res) {
    try {
        const [
            activeCompanyCount,
            activeSiteCount,
            activeUserCount,
            expiringAdmins,
            annualRevenue,
            monthlyNewRegistrations,
            recentRegistrations
        ] = await Promise.all([
            getActiveCompanyCounts(),
            getActiveSiteCounts(),
            getActiveUserCounts(),
            getAdminsWithExpiringAccounts(),
            calculateAnnualRevenue(),
            getMonthlyNewRegistrations(),
            getRecentNewRegistrations()
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalCompanies: activeCompanyCount,
                totalSites: activeSiteCount,
                totalResidents: activeUserCount,
                expiringAccounts: expiringAdmins.map(admin => ({
                    id: admin.id,
                    full_name: admin.full_name,
                    email: admin.email,
                    account_type: admin.account_type,
                    company_name: admin.company_name,
                    company_code: admin.company_code,
                    expiry_date: admin.accountExpiryDate,
                    days_remaining: admin.daysRemaining
                })),
                totalRevenue: annualRevenue,
                monthlyRegistrations: monthlyNewRegistrations,
                newRegistrations: recentRegistrations.map(admin => ({
                    id: admin.id,
                    full_name: admin.full_name,
                    email: admin.email,
                    account_type: admin.account_type,
                    company_name: admin.company_name,
                    company_code: admin.company_code,
                    created_at: admin.created_at
                }))
            }
        });

    } catch (error) {
        console.error("❌ Dashboard fetch error:", error);
        return res.status(500).json({
            success: false,
            message: "Dashboard verileri yüklenirken hata oluştu",
            error: error.message
        });
    }
}

export async function extendSubscription(req, res) {
    try {
        const { accountId } = req.params;
        const { months } = req.body;

        if (!accountId) {
            return res.status(400).json({
                success: false,
                message: 'Hesap ID gerekli'
            });
        }

        if (months && (months < 1 || months > 120)) {
            return res.status(400).json({
                success: false,
                message: 'Süre 1-120 ay arasında olmalıdır'
            });
        }

        const result = await extendAccountSubscription(
            accountId,
            null, // accountType artık gerekli değil, service içinde tespit ediliyor
            months || 12
        );

        return res.status(200).json({
            success: true,
            message: result.message,
            data: {
                admin: result.admin,
                oldExpiryDate: result.oldExpiryDate,
                newExpiryDate: result.newExpiryDate,
                extendedMonths: result.extendedMonths
            }
        });

    } catch (error) {
        console.error('❌ Süre uzatma hatası:', error);
        
        if (error.message === 'Hesap bulunamadı') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === 'Bu hesap tipi için süre uzatma işlemi yapılamaz') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Hesap süresi uzatılırken hata oluştu'
        });
    }
}