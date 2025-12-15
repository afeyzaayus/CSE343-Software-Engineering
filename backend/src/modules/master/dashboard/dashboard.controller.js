import {
    getActiveCompanyCounts,
    getActiveSiteCounts,
    getActiveUserCounts,
    getActiveIndividualCounts,
    getAdminsWithExpiringAccounts,
    calculateAnnualRevenue,
    getMonthlyNewRegistrationsWithDetails,
    extendAccountSubscription,
    getAccountPrices,
    updateAccountPrice
} from './dashboard.service.js';

// Dashboard metriklerini getir
export async function fetchDashboardMetrics(req, res) {
    try {
        const [
            activeCompanyCount,
            activeSiteCount,
            activeUserCount,
            activeIndividualCount,
            expiringAdmins,
            annualRevenue,
            monthlyNewRegistrationsWithDetails
        ] = await Promise.all([
            getActiveCompanyCounts(),
            getActiveSiteCounts(),
            getActiveUserCounts(),
            getActiveIndividualCounts(),
            getAdminsWithExpiringAccounts(),
            calculateAnnualRevenue(),
            getMonthlyNewRegistrationsWithDetails()
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalCompanies: activeCompanyCount,
                totalSites: activeSiteCount,
                totalResidents: activeUserCount,
                totalIndividuals: activeIndividualCount,
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
                monthlyRegistrations: monthlyNewRegistrationsWithDetails.count,
                newRegistrations: monthlyNewRegistrationsWithDetails.list
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

// Hesap süresini uzat
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

// Yıllık fiyatları getir
export async function fetchAccountPrices(req, res) {
    try {
        const prices = await getAccountPrices();
        const annualRevenue = await calculateAnnualRevenue();
        return res.status(200).json({
            success: true,
            data: {
                ...prices,
                annualRevenue,
                info: "Fiyatlar yıllık ücretlendirme esasına göredir."
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Fiyatlar alınırken hata oluştu",
            error: error.message
        });
    }
}
// Yıllık fiyat güncelle
export async function updateAccountPriceController(req, res) {
    try {
        const { type, value } = req.body;
        if (!type || typeof value === 'undefined') {
            return res.status(400).json({
                success: false,
                message: "Tip ve değer zorunludur"
            });
        }
        if (!['INDIVIDUAL', 'COMPANY'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Tip sadece INDIVIDUAL veya COMPANY olabilir"
            });
        }
        if (isNaN(Number(value)) || Number(value) < 0) {
            return res.status(400).json({
                success: false,
                message: "Geçerli bir fiyat giriniz"
            });
        }
        const updated = await updateAccountPrice(type, value);
        return res.status(200).json({
            success: true,
            data: {
                ...updated,
                info: "Fiyat yıllık olarak güncellenmiştir."
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Fiyat güncellenirken hata oluştu",
            error: error.message
        });
    }
}