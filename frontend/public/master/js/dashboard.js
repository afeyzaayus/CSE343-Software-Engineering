import { formatCurrency, showToast, getToken } from './common.js';

const API_BASE_URL = 'http://localhost:5000/api';

// Hesap tipini Türkçe'ye çevir
function getAccountTypeLabel(accountType) {
    const typeMap = {
        'COMPANY_MANAGER': 'Şirket Yöneticisi',
        'COMPANY_EMPLOYEE': 'Şirket Çalışanı',
        'INDIVIDUAL': 'Bireysel',
        'SITE_USER': 'Site Kullanıcısı'
    };
    return typeMap[accountType] || accountType || 'N/A';
}

// Dashboard verilerini yükle
async function loadDashboardData() {
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/master/dashboard/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Dashboard verileri alınamadı');
        }

        const result = await response.json();
        console.log('API Response:', result);

        const stats = result.data || result;
        console.log('Stats Data:', stats);

        updateStats(stats);
    } catch (error) {
        console.error('Dashboard yükleme hatası:', error);
        showToast('Dashboard verileri yüklenirken hata oluştu', 'error');
    }
}

// İstatistikleri güncelle
function updateStats(stats) {
    console.log('Updating stats with:', stats);

    document.getElementById('totalCompanies').textContent = stats.totalCompanies || 0;
    document.getElementById('totalIndividuals').textContent = stats.totalIndividuals || 0;
    document.getElementById('totalSites').textContent = stats.totalSites || 0;
    document.getElementById('totalResidents').textContent = stats.totalResidents || 0;
    document.getElementById('totalRevenue').textContent = formatCurrency(stats.totalRevenue || 0);

    // Aylık kayıt sayısını backend'den gelen monthlyRegistrations ile güncelle
    const monthlyRegsEl = document.querySelector('#monthlyRegistrations h3');
    if (monthlyRegsEl) {
        monthlyRegsEl.textContent = stats.monthlyRegistrations || (stats.newRegistrations ? stats.newRegistrations.length : 0);
    }

    // Yenileme gereken hesaplar
    displayExpiringAccounts(stats.expiringAccounts || []);

    // Karttaki toplam sayıyı güncelle
    const expiringCountEl = document.getElementById('expiringAccountsCount');
    if (expiringCountEl) {
        expiringCountEl.textContent = (stats.expiringAccounts || []).length;
    }

    // Yeni kayıtlar
    displayNewRegistrations(stats.newRegistrations || []);

    // Yıllık tahmini kazanç (totalRevenue veya annualRevenue)
    const revenue = stats.totalRevenue || stats.annualRevenue || 0;

    // Stat kartı
    const statRevenueElem = document.querySelector('.stat-card .stat-info #totalRevenue');
    if (statRevenueElem) {
        statRevenueElem.textContent = `${formatCurrency(revenue)} ₺`;
    }

    // Modal içi
    const modalRevenueElem = document.querySelector('.modal .revenue-amount #totalRevenue');
    if (modalRevenueElem) {
        modalRevenueElem.textContent = formatCurrency(revenue);
    }
}

function displayExpiringAccounts(accounts) {
    const container = document.getElementById('expiringAccounts');
    if (!container) return;

    if (!accounts.length) {
        container.innerHTML = '<p class="empty-message">Yenileme gereken hesap bulunmuyor.</p>';
        return;
    }

    container.innerHTML = accounts.map(account => {
        const expiry = new Date(account.expiry_date);
        const diffDays = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));

        const urgencyClass = diffDays <= 7 ? 'urgent' : diffDays <= 15 ? 'warning' : 'normal';

        // Hesap tipi kontrolü
        const isCompany = account.account_type === 'COMPANY_MANAGER' || account.account_type === 'COMPANY_EMPLOYEE';
        const displayName = isCompany ? account.company_name : account.full_name;

        return `
            <div class="account-card ${urgencyClass}">
                <div class="account-header">
                    <h4>${displayName}</h4>
                    <span class="account-type-badge">${getAccountTypeLabel(account.account_type)}</span>
                </div>
                <div class="account-details">
                    ${account.email ? `<p class="account-email">📧 ${account.email}</p>` : ''}
                    ${isCompany && account.company_name ? `<p class="company-info">🏢 ${account.company_name}</p>` : ''}
                    ${isCompany && account.company_code ? `<p class="company-code">🔑 Kod: ${account.company_code}</p>` : ''}
                    <p class="expiry-info">📅 Son gün: ${expiry.toLocaleDateString('tr-TR')}</p>
                </div>
                <div class="days-remaining-container">
                    <span class="days-remaining ${urgencyClass}">
                        ⏰ ${diffDays} gün kaldı
                    </span>
                </div>
                <div class="account-card-footer">
                    <div class="payment-renewal-section">
                        <label class="payment-checkbox">
                            <input type="checkbox" class="payment-confirmed" data-account-id="${account.id}">
                            <span class="checkbox-label">Ödeme Yenilendi</span>
                        </label>
                        <button class="btn btn-primary btn-extend" 
                                data-account-id="${account.id}" 
                                data-account-type="${account.account_type}"
                                disabled>
                            1 Yıl Uzat
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Checkbox ve buton etkileşimlerini ayarla
    const cards = container.querySelectorAll('.account-card');
    cards.forEach(card => {
        const checkbox = card.querySelector('.payment-confirmed');
        const extendBtn = card.querySelector('.btn-extend');

        // Checkbox değiştiğinde butonu aktif/pasif yap
        checkbox.addEventListener('change', (e) => {
            extendBtn.disabled = !e.target.checked;
            if (e.target.checked) {
                extendBtn.classList.add('enabled');
            } else {
                extendBtn.classList.remove('enabled');
            }
        });

        // Uzatma butonuna event listener ekle
        extendBtn.addEventListener('click', (e) => {
            const accountId = e.target.dataset.accountId;
            const accountType = e.target.dataset.accountType;
            const accountName = card.querySelector('h4').textContent;
            extendSubscription(accountId, accountName, accountType, checkbox);
        });
    });
}

// Abonelik uzatma fonksiyonu - güncellenmiş
async function extendSubscription(accountId, accountName, accountType, checkbox) {
    if (!confirm(`${accountName} hesabının kullanım süresini 1 yıl uzatmak istediğinize emin misiniz?`)) {
        return;
    }

    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/master/accounts/${accountId}/extend-subscription`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                months: 12,
                accountType: accountType 
            })
        });

        if (!response.ok) {
            throw new Error('Abonelik uzatılamadı');
        }

        const result = await response.json();
        showToast(`${accountName} hesabının kullanım süresi başarıyla 1 yıl uzatıldı!`, 'success');

        // Checkbox'ı sıfırla
        if (checkbox) {
            checkbox.checked = false;
        }

        // Dashboard'u yenile
        loadDashboardData();

    } catch (error) {
        console.error('Hata:', error);
        showToast('Abonelik uzatılırken bir hata oluştu.', 'error');
    }
}

// Yeni kayıtları göster
function displayNewRegistrations(list) {
    const container = document.getElementById('newRegistrationsList');
    if (!container) return;

    if (!list.length) {
        container.innerHTML = '<p class="empty-message">Yeni kayıt bulunmuyor.</p>';
        return;
    }

    container.innerHTML = list.map(item => {
        const registrationDate = new Date(item.created_at);
        const now = new Date();
        const daysAgo = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
        const hoursAgo = Math.floor((now - registrationDate) / (1000 * 60 * 60));

        let timeAgoText;
        if (daysAgo === 0) {
            if (hoursAgo === 0) {
                timeAgoText = 'Az önce';
            } else if (hoursAgo === 1) {
                timeAgoText = '1 saat önce';
            } else {
                timeAgoText = `${hoursAgo} saat önce`;
            }
        } else if (daysAgo === 1) {
            timeAgoText = 'Dün';
        } else {
            timeAgoText = `${daysAgo} gün önce`;
        }

        // Şirket mi bireysel mi kontrolü
        if (item.type === 'COMPANY') {
            return `
                <div class="account-card new-registration">
                    <div class="account-header">
                        <h4>${item.name || '-'}</h4>
                        <span class="account-type-badge">Şirket</span>
                    </div>
                    <div class="account-details">
                        ${item.code ? `<p class="company-code">🔑 Kod: ${item.code}</p>` : ''}
                        ${item.manager_full_name ? `<p class="manager-info">👤 Yönetici: ${item.manager_full_name}</p>` : ''}
                        ${item.manager_email ? `<p class="account-email">📧 ${item.manager_email}</p>` : ''}
                        <p class="registration-date">📅 Kayıt tarihi: ${registrationDate.toLocaleDateString('tr-TR')} ${registrationDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div class="days-ago-container">
                        <span class="days-ago">
                            🆕 ${timeAgoText}
                        </span>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="account-card new-registration">
                    <div class="account-header">
                        <h4>${item.full_name || '-'}</h4>
                        <span class="account-type-badge">${getAccountTypeLabel(item.account_type)}</span>
                    </div>
                    <div class="account-details">
                        ${item.email ? `<p class="account-email">📧 ${item.email}</p>` : ''}
                        <p class="registration-date">📅 Kayıt tarihi: ${registrationDate.toLocaleDateString('tr-TR')} ${registrationDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div class="days-ago-container">
                        <span class="days-ago">
                            🆕 ${timeAgoText}
                        </span>
                    </div>
                </div>
            `;
        }
    }).join('');
}

// Tab geçişleri
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.tab;

            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const target = document.getElementById(targetId);
            if (target) {
                target.classList.add('active');
            }
        });
    });
}

async function fillCurrentPrices() {
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/master/prices`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Fiyatlar alınamadı');
        const result = await response.json();
        const prices = result.data || result;
        document.getElementById('individual-price').value = prices.individual ?? 0;
        document.getElementById('company-price').value = prices.company ?? 0;
    } catch (error) {
        document.getElementById('individual-price').value = 0;
        document.getElementById('company-price').value = 0;
    }
}

// Modal açılırken fiyatları doldur
function openModal() {
    const modal = document.getElementById('priceManagementModal');
    if (modal) {
        fillCurrentPrices();
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }
}
function closeModal() {
    const modal = document.getElementById('priceManagementModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
}

// Fiyat güncelleme fonksiyonu
async function updatePrice(accountType) {
    const inputId = accountType === 'INDIVIDUAL' ? 'individual-price' : 'company-price';
    const priceInput = document.getElementById(inputId);
    const newPrice = priceInput.value;
    
    if (!newPrice || newPrice < 0) {
        showPriceUpdateResult('Lütfen geçerli bir fiyat girin', 'error');
        return;
    }

    const button = event.target.closest('.btn-update');
    button.classList.add('loading');
    button.disabled = true;

    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/master/prices/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                type: accountType,
                value: parseFloat(newPrice)
            })
        });

        if (!response.ok) {
            throw new Error('Fiyat güncellenemedi');
        }

        const result = await response.json();
        showPriceUpdateResult(
            `${accountType === 'INDIVIDUAL' ? 'Bireysel' : 'Şirket'} hesap fiyatı başarıyla güncellendi!`,
            'success'
        );

        // Dashboard'u yenile
        setTimeout(() => {
            loadDashboardData();
        }, 1500);

    } catch (error) {
        console.error('Fiyat güncelleme hatası:', error);
        showPriceUpdateResult('Fiyat güncellenirken bir hata oluştu', 'error');
    } finally {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// Fiyat güncelleme sonuç mesajını göster
function showPriceUpdateResult(message, type) {
    const resultDiv = document.getElementById('price-update-result');
    if (resultDiv) {
        resultDiv.textContent = message;
        resultDiv.className = `price-update-result ${type} show`;
        
        setTimeout(() => {
            resultDiv.classList.remove('show');
        }, 5000);
    }
}

// DOMContentLoaded içine eklenecek event listener'lar
document.addEventListener('DOMContentLoaded', () => {
    const priceBtn = document.getElementById('priceManagementBtn');
    const priceModal = document.getElementById('priceManagementModal');
    const closeModalBtn = document.getElementById('closeModal');

    if (priceBtn) {
        priceBtn.addEventListener('click', openModal);
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    if (priceModal) {
        priceModal.addEventListener('click', (e) => {
            if (e.target === priceModal) {
                closeModal();
            }
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });  

    // Diğer başlangıç fonksiyonları
    loadDashboardData();
    initTabs();

    // Global fonksiyonları window'a ekle
    window.updatePrice = updatePrice;
});