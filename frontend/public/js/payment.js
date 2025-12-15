// Payment Page Script
const API_BASE_URL = 'http://localhost:3000/api';
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));
const SITE_ID = selectedSite?.site_id;
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Debug
console.log('selectedSite:', selectedSite);
console.log('SITE_ID:', SITE_ID, 'type:', typeof SITE_ID);

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    if (!selectedSite || !SITE_ID) {
        alert('Site seçilmedi. Ana sayfaya yönlendiriliyorsunuz.');
        window.location.href = '/admin-dashboard.html';
        return;
    }

    if (!currentUser) {
        window.location.href = '/login.html';
        return;
    }

    // Dashboard başlığı
    const dashboardTitle = document.getElementById('dashboard-title');
    if (dashboardTitle) {
        dashboardTitle.textContent = `Aidat Takibi - ${selectedSite.site_name}`;
    }

    // Admin bilgisi (sağ üst)
    const userInfo = document.getElementById('dashboard-user-info');
    if (userInfo) {
        userInfo.innerHTML = `
            <div class="user-avatar">${(currentUser.full_name || 'A')[0].toUpperCase()}</div>
            <div style="margin-left: 10px;">
                <div style="font-weight: 600;">${currentUser.full_name}</div>
                <div style="font-size: 12px; opacity: 0.8;">${currentUser.account_type}</div>
            </div>
        `;
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('selectedSite');
            window.location.href = '/admin-dashboard.html';
        });
    }

    // Ödemeleri yükle
    loadPayments();
    
    // Modal kontrolü
    setupModal();
    
    // Sakinleri yükle
    loadResidents();
});

// Ödemeleri API'den çek
async function loadPayments() {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    try {
        // API URL: GET /api/payments/site/:siteId (path parameter kullan)
        console.log(`📡 API isteği: ${API_BASE_URL}/payments/site/${SITE_ID}`);
        const response = await fetch(`${API_BASE_URL}/payments/site/${SITE_ID}`, { headers });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('API Hatası:', response.status, error);
            throw new Error(`API Error ${response.status}: ${error.message || 'Bilinmeyen hata'}`);
        }
        
        const result = await response.json();
        const payments = result.data || result.payments || [];
        
        console.log('✅ Ödemeler yüklendi:', payments.length, 'adet');
        
        // Ödeyenler ve ödemeyenler listelerini render et
        renderPaidAndUnpaidLists(payments);
    } catch (error) {
        console.error('Ödemeler yüklenirken hata:', error);
        alert('Ödemeler yüklenirken bir hata oluştu.');
    }
}

// Ödeyenler ve ödemeyenler listelerini render et
async function renderPaidAndUnpaidLists(payments) {
    const paidTableBody = document.querySelector('#paid-section tbody');
    const unpaidTableBody = document.querySelector('#unpaid-section tbody');
    
    if (!paidTableBody || !unpaidTableBody) {
        console.error('Tablo elementleri bulunamadı!');
        return;
    }
    
    console.log('📊 Render başlıyor - Toplam ödemeler:', payments.length);
    console.log('📊 Gelen ödeme verileri:', payments);
    
    // Tüm ödemeleri direkt göster (ay filtreleme kaldırıldı)
    const allPayments = payments;
    
    console.log('📊 Gösterilecek ödemeler:', allPayments.length);
    
    // Ödeyenler tablosunu doldur
    if (allPayments.length === 0) {
        paidTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Henüz ödeme yapılmamış.</td></tr>';
    } else {
        // payment_method enum değerlerini Türkçeye çevir
        const methodLabels = {
            'CASH': 'Nakit',
            'CREDIT_CARD': 'Kredi Kartı',
            'BANK_TRANSFER': 'Havale/EFT',
            'CHECK': 'Çek',
            'OTHER': 'Diğer',
            'nakit': 'Nakit',
            'kredi_karti': 'Kredi Kartı',
            'havale': 'Havale/EFT',
            'cek': 'Çek'
        };
        
        paidTableBody.innerHTML = allPayments.map(payment => {
            let dateStr = '-';
            try {
                const paymentDate = new Date(payment.payment_date);
                dateStr = paymentDate.toLocaleDateString('tr-TR');
            } catch (e) {
                console.error('Tarih parsing hatası:', payment.payment_date, e);
            }
            
            const methodLabel = methodLabels[payment.payment_method] || payment.payment_method;
            
            console.log('📝 Satır oluşturuluyor:', {
                user: payment.user,
                full_name: payment.user?.full_name,
                block_no: payment.user?.block_no,
                apartment_no: payment.user?.apartment_no
            });
            
            return `
            <tr>
                <td>${payment.user?.block_no || '-'}-${payment.user?.apartment_no || '-'}</td>
                <td>${payment.user?.full_name || '-'}</td>
                <td>${dateStr}</td>
                <td>${payment.amount} TL</td>
                <td>${methodLabel}</td>
            </tr>
        `;
        }).join('');
    }
    
    // Tablo başlığını güncelle
    const paidHeader = document.querySelector('#paid-section .table-subtitle');
    if (paidHeader) {
        paidHeader.textContent = `Toplam - ${allPayments.length} Daire`;
    }
    
    // Ödemeyenler için tüm sakinleri çek
    try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const residentsResponse = await fetch(`${API_BASE_URL}/payments/site/${SITE_ID}/residents`, { headers });
        
        if (residentsResponse.ok) {
            const residentsResult = await residentsResponse.json();
            const allResidents = residentsResult.data || residentsResult.residents || [];
            
            console.log('👥 Tüm sakinler:', allResidents);
            console.log('💰 Ödeme yapan kullanıcı ID\'leri:', Array.from(new Set(allPayments.map(p => p.userId))));
            
            // Ödeme yapmayan sakinleri bul
            const paidUserIds = new Set(allPayments.map(p => p.userId));
            const unpaidResidents = allResidents.filter(r => !paidUserIds.has(r.id));
            
            console.log('👥 Ödeme yapmayanlar:', unpaidResidents);
            
            if (unpaidResidents.length === 0) {
                unpaidTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Tüm sakinler aidatını ödedi! 🎉</td></tr>';
            } else {
                unpaidTableBody.innerHTML = unpaidResidents.map(resident => {
                    return `
                        <tr>
                            <td>${resident.block_no || '-'}-${resident.apartment_no || '-'}</td>
                            <td>${resident.full_name || '-'}</td>
                            <td>${resident.phone_number || '-'}</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                    `;
                }).join('');
            }
            
            // Ödemeyenler başlığını güncelle
            const unpaidHeader = document.querySelector('#unpaid-section .table-subtitle');
            if (unpaidHeader) {
                unpaidHeader.textContent = `Toplam - ${unpaidResidents.length} Daire`;
            }
        }
    } catch (error) {
        console.error('Sakinler yüklenirken hata:', error);
        unpaidTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Sakinler yüklenemedi.</td></tr>';
    }
}

// Sakinleri yükle
async function loadResidents() {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    console.log('🏠 Sakinler yükleniyor - SITE_ID:', SITE_ID);
    
    try {
        // Sakinleri çek
        const url = `${API_BASE_URL}/payments/site/${SITE_ID}/residents`;
        console.log('📡 Residents API URL:', url);
        
        const response = await fetch(url, { headers });
        
        console.log('📡 Residents API Response Status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Sakinler API hatası:', errorData);
            throw new Error('Sakinler yüklenemedi: ' + (errorData.message || response.statusText));
        }
        
        const result = await response.json();
        console.log('✅ Sakinler API yanıtı:', result);
        
        const allResidents = result.data || result.residents || [];
        console.log('👥 Toplam sakin sayısı:', allResidents.length);
        
        // Ödemeleri çek ve ödeme yapanları bul
        let paidUserIds = new Set();
        try {
            const paymentsResponse = await fetch(`${API_BASE_URL}/payments/site/${SITE_ID}`, { headers });
            if (paymentsResponse.ok) {
                const paymentsResult = await paymentsResponse.json();
                const payments = paymentsResult.data || [];
                paidUserIds = new Set(payments.map(p => p.userId));
                console.log('💰 Ödeme yapanlar:', Array.from(paidUserIds));
            }
        } catch (error) {
            console.error('⚠️ Ödemeler yüklenirken hata (form yine de açılacak):', error);
        }
        
        // Sadece ödeme yapmayanları filtrele
        const unpaidResidents = allResidents.filter(r => !paidUserIds.has(r.id));
        console.log('👥 Ödeme yapmayanlar:', unpaidResidents.length);
        
        // Dropdown'ı doldur
        const select = document.getElementById('paymentApartment');
        if (select) {
            if (unpaidResidents.length === 0) {
                select.innerHTML = '<option value="">Tüm sakinler ödeme yaptı! 🎉</option>';
                console.warn('⚠️ Ödeme yapacak sakin bulunamadı!');
            } else {
                select.innerHTML = '<option value="">Daire seçin</option>' + 
                    unpaidResidents.map(resident => {
                        console.log('👤 Sakin (Ödeme yapacak):', resident);
                        return `<option value="${resident.id}">${resident.block_no}-${resident.apartment_no} - ${resident.full_name}</option>`;
                    }).join('');
                console.log('✅ Dropdown dolduruldu');
            }
        } else {
            console.error('❌ paymentApartment select elementi bulunamadı!');
        }
    } catch (error) {
        console.error('❌ Sakinler yüklenirken hata:', error);
        alert('Sakinler yüklenirken bir hata oluştu: ' + error.message);
    }
}

// Modal işlemleri
function setupModal() {
    const modal = document.getElementById('addPaymentModal');
    const addBtn = document.getElementById('addPaymentBtn');
    const closeBtn = modal.querySelector('.close-btn');
    const form = document.getElementById('paymentForm');
    
    // Modal aç
    addBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        // Bugünün tarihini default olarak ayarla
        document.getElementById('paymentDate').valueAsDate = new Date();
    });
    
    // Modal kapat
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        form.reset();
    });
    
    // Modal dışına tıklanırsa kapat
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            form.reset();
        }
    });
    
    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createPayment();
    });
}

// Ödeme oluştur
async function createPayment() {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const userId = document.getElementById('paymentApartment').value;
    const amount = document.getElementById('paymentAmount').value;
    const payment_date = document.getElementById('paymentDate').value;
    const paymentTypeValue = document.getElementById('paymentType').value;
    
    // Validasyon
    if (!userId || !amount || !payment_date || !paymentTypeValue) {
        alert('Lütfen tüm alanları doldurun.');
        return;
    }
    
    // SITE_ID kontrolü
    if (!SITE_ID) {
        alert('Site bilgisi bulunamadı. Lütfen sayfayı yenileyin.');
        return;
    }
    
    // Frontend değerlerini Backend enum'lerine dönüştür
    const methodMapping = {
        'nakit': 'CASH',
        'banka': 'BANK_TRANSFER',
        'kredi': 'CREDIT_CARD'
    };
    
    const payment_method = methodMapping[paymentTypeValue] || paymentTypeValue;
    
    const paymentData = {
        userId: parseInt(userId),
        siteId: SITE_ID,
        amount: parseFloat(amount),
        payment_date,
        payment_method,
        description: `Ödeme - ${paymentTypeValue}`
    };
    
    console.log('📤 Gönderilen ödeme verisi:', paymentData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/payments`, {
            method: 'POST',
            headers,
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Ödeme eklenemedi');
        }
        
        alert('Ödeme başarıyla eklendi!');
        
        // Modal'ı kapat ve formu sıfırla
        document.getElementById('addPaymentModal').style.display = 'none';
        document.getElementById('paymentForm').reset();
        
        // Ödemeleri yeniden yükle
        loadPayments();
    } catch (error) {
        console.error('Ödeme oluşturma hatası:', error);
        alert('Ödeme eklenirken bir hata oluştu: ' + error.message);
    }
}
