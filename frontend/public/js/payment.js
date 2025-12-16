// Monthly Payment Tracking System
const API_BASE_URL = 'http://localhost:3000/api';
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));
const SITE_ID = selectedSite?.site_id;
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Ayları Türkçeye çevir
const monthNames = {
    1: 'Ocak', 2: 'Şubat', 3: 'Mart', 4: 'Nisan',
    5: 'Mayıs', 6: 'Haziran', 7: 'Temmuz', 8: 'Ağustos',
    9: 'Eylül', 10: 'Ekim', 11: 'Kasım', 12: 'Aralık'
};

let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();
let allResidents = [];
let currentMonthlyDues = [];
let pendingPaymentData = null;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    if (!selectedSite || !SITE_ID) {
        alert('Site seçilmedi.');
        window.location.href = '/admin-dashboard.html';
        return;
    }

    if (!currentUser) {
        window.location.href = '/login.html';
        return;
    }

    // Başlığı güncelle
    document.getElementById('dashboard-title').textContent = `Aidat Takibi - ${selectedSite.site_name}`;

    // Sağ üst köşe admin bilgisi
    const userInfo = document.getElementById('dashboard-user-info');
    if (userInfo && currentUser) {
        userInfo.innerHTML = `
            <div class="user-avatar" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #2196F3; color: white; border-radius: 50%; font-weight: bold;">${(currentUser.full_name || 'A')[0].toUpperCase()}</div>
            <div style="margin-left: 10px;">
                <div style="font-weight: 600;">${currentUser.full_name}</div>
                <div style="font-size: 12px; opacity: 0.8;">${currentUser.account_type}</div>
            </div>
        `;
    }

    // Yıl seçeneğini doldur
    fillYearSelect();

    // Ay ve yıl seçim değerlerini mevcut ay/yıla ayarla
    document.getElementById('monthSelect').value = currentMonth;
    document.getElementById('yearSelect').value = currentYear;

    // Ay ve yıl seçim eventleri
    document.getElementById('monthSelect').addEventListener('change', loadMonthlyData);
    document.getElementById('yearSelect').addEventListener('change', loadMonthlyData);

    // Aidatları oluştur butonu
    document.getElementById('createMonthlyBtn').addEventListener('click', () => {
        document.getElementById('createMonthlyModal').classList.add('show');
        document.getElementById('createMonth').value = currentMonth;
        document.getElementById('createYear').value = currentYear;
    });

    // Aidatları oluştur formu
    document.getElementById('createMonthlyForm').addEventListener('submit', createMonthlyDues);

    // Ödemeyi kaydet formu
    document.getElementById('recordPaymentForm').addEventListener('submit', submitRecordPayment);

    // Modal kapatıcılar
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('show');
        });
    });

    // Modal dışında tıklanırsa kapat
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });

    // İlk veriler yükle
    await loadMonthlyData();
    await loadResidents();
});

// Yıl seçeneğini doldur
function fillYearSelect() {
    const yearSelect = document.getElementById('yearSelect');
    const currentYearValue = currentYear;
    
    for (let year = currentYearValue - 2; year <= currentYearValue + 2; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYearValue) option.selected = true;
        yearSelect.appendChild(option);
    }
}

// Aylık verileri yükle
async function loadMonthlyData() {
    const month = document.getElementById('monthSelect').value;
    const year = document.getElementById('yearSelect').value;
    
    currentMonth = parseInt(month);
    currentYear = parseInt(year);

    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
        // Aylık aidatları getir
        const response = await fetch(
            `${API_BASE_URL}/payments/site/${SITE_ID}/monthly?month=${month}&year=${year}`,
            { headers }
        );

        if (!response.ok) throw new Error('Aidatları getirme başarısız');

        const result = await response.json();
        currentMonthlyDues = result.data || [];

        // Özeti güncelle
        updateSummary();

        // Tabloları render et
        renderTables();

    } catch (error) {
        console.error('Hata:', error);
        alert('Aidatlar yüklenemedi: ' + error.message);
    }
}

// Sakinleri yükle
async function loadResidents() {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
        const response = await fetch(
            `${API_BASE_URL}/payments/site/${SITE_ID}/residents`,
            { headers }
        );

        if (!response.ok) throw new Error('Sakinleri getirme başarısız');

        const result = await response.json();
        allResidents = result.data || [];

        // Modal'da sakinleri doldur
        fillResidentSelect();

    } catch (error) {
        console.error('Hata:', error);
    }
}

// Sakin seçim listesini doldur
function fillResidentSelect() {
    const select = document.getElementById('paymentApartment');
    select.innerHTML = '<option value="">Daire seçin</option>';

    allResidents.forEach(resident => {
        const option = document.createElement('option');
        option.value = resident.id;
        option.textContent = `${resident.block_no}-${resident.apartment_no} - ${resident.full_name}`;
        select.appendChild(option);
    });
}

// Özet güncelle
function updateSummary() {
    const paidCount = currentMonthlyDues.filter(d => d.payment_status === 'PAID').length;
    const unpaidCount = currentMonthlyDues.filter(d => d.payment_status === 'UNPAID').length;
    const overdueCount = currentMonthlyDues.filter(d => d.payment_status === 'OVERDUE').length;

    const paidTotal = currentMonthlyDues
        .filter(d => d.payment_status === 'PAID')
        .reduce((sum, d) => sum + d.amount, 0);
    const unpaidTotal = currentMonthlyDues
        .filter(d => d.payment_status === 'UNPAID')
        .reduce((sum, d) => sum + d.amount, 0);
    const overdueTotal = currentMonthlyDues
        .filter(d => d.payment_status === 'OVERDUE')
        .reduce((sum, d) => sum + d.amount, 0);

    const summaryHTML = `
        <div class="summary-card paid">
            <div class="summary-label">Ödenmiş</div>
            <div class="summary-value">${paidCount}</div>
            <div style="font-size: 12px;">${paidTotal.toFixed(2)} TL</div>
        </div>
        <div class="summary-card unpaid">
            <div class="summary-label">Ödenmemiş</div>
            <div class="summary-value">${unpaidCount}</div>
            <div style="font-size: 12px;">${unpaidTotal.toFixed(2)} TL</div>
        </div>
        <div class="summary-card overdue">
            <div class="summary-label">Vadesi Geçmiş</div>
            <div class="summary-value">${overdueCount}</div>
            <div style="font-size: 12px;">${overdueTotal.toFixed(2)} TL</div>
        </div>
    `;

    document.getElementById('dueSummary').innerHTML = summaryHTML;
}

// Tabloları render et
function renderTables() {
    const paid = currentMonthlyDues.filter(d => d.payment_status === 'PAID');
    const unpaid = currentMonthlyDues.filter(d => d.payment_status === 'UNPAID');
    const overdue = currentMonthlyDues.filter(d => d.payment_status === 'OVERDUE');

    // Ödenmiş tablo
    renderPaidTable(paid);

    // Ödenmemiş tablo (overdue bilgisini de göster)
    renderUnpaidTable(unpaid, overdue);

    // Overdue tablo
    renderOverdueTable(overdue);
}

// Ödenmiş tablosu
function renderPaidTable(paid) {
    const tbody = document.querySelector('#paid-section tbody');
    
    if (paid.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Bu ayda henüz ödeme yapılmamış.</td></tr>';
        return;
    }

    tbody.innerHTML = paid.map(due => {
        const paidDate = new Date(due.paid_date).toLocaleDateString('tr-TR');
        return `
            <tr>
                <td>${due.user.block_no}-${due.user.apartment_no}</td>
                <td>${due.user.full_name}</td>
                <td>${paidDate}</td>
                <td>${due.amount} TL</td>
                <td>${due.payment_method || '-'}</td>
                <td><span class="status-badge paid">Ödendi</span></td>
            </tr>
        `;
    }).join('');
}

// Ödenmemiş tablosu
function renderUnpaidTable(unpaid, overdue) {
    const tbody = document.querySelector('#unpaid-section tbody');
    
    if (unpaid.length === 0) {
        if (overdue.length > 0) {
            // UNPAID yok ama OVERDUE var
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #ff9800;">Bu ayda yeni ödenmemiş aidatı yok (tüm aidatlar vadesi geçmiştir)</td></tr>';
        } else {
            // Ne UNPAID ne OVERDUE - o ay için hiç kayıt yok
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Bu ay için kayıt bulunamadı.</td></tr>';
        }
        return;
    }

    tbody.innerHTML = unpaid.map(due => {
        const dueDate = new Date(due.due_date).toLocaleDateString('tr-TR');
        return `
            <tr>
                <td>${due.user.block_no}-${due.user.apartment_no}</td>
                <td>${due.user.full_name}</td>
                <td>${due.user.phone_number}</td>
                <td>${dueDate}</td>
                <td><span class="status-badge unpaid">Bekleniyor</span></td>
                <td>
                    <button class="btn btn-sm" onclick="recordPayment(${due.id}, ${due.userId})" style="padding: 5px 10px; font-size: 12px;">
                        <i class="fas fa-check"></i> Ödendi İşaretle
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Overdue tablosu
function renderOverdueTable(overdue) {
    const tbody = document.querySelector('#overdue-section tbody');
    
    if (overdue.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Vadesi geçmiş aidatı yok.</td></tr>';
        return;
    }

    tbody.innerHTML = overdue.map(due => {
        const dueDate = new Date(due.due_date);
        const today = new Date();
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

        return `
            <tr>
                <td>${due.user.block_no}-${due.user.apartment_no}</td>
                <td>${due.user.full_name}</td>
                <td>${due.user.phone_number}</td>
                <td>${dueDate.toLocaleDateString('tr-TR')}</td>
                <td><strong style="color: #f44336;">${daysOverdue} gün</strong></td>
                <td>
                    <button class="btn btn-sm" onclick="recordPayment(${due.id}, ${due.userId})" style="padding: 5px 10px; font-size: 12px; background: #ff9800;">
                        <i class="fas fa-check"></i> Ödendi İşaretle
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Aidatları oluştur
async function createMonthlyDues(e) {
    e.preventDefault();

    const month = document.getElementById('createMonth').value;
    const year = document.getElementById('createYear').value;
    const amount = document.getElementById('createAmount').value;
    const due_date = document.getElementById('createDueDate').value;

    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };

    try {
        const response = await fetch(`${API_BASE_URL}/payments/monthly/create-all`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                siteId: SITE_ID,
                month: parseInt(month),
                year: parseInt(year),
                amount: parseFloat(amount),
                due_date: new Date(due_date).toISOString()
            })
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        alert('✅ ' + result.message);
        document.getElementById('createMonthlyModal').classList.remove('show');
        document.getElementById('createMonthlyForm').reset();
        
        // Verileri yenile
        await loadMonthlyData();

    } catch (error) {
        alert('❌ Hata: ' + error.message);
    }
}

// Ödemeyi kaydet (UNPAID -> PAID)
async function recordPayment(monthlyDueId, userId) {
    // Modal'da görüntülenecek bilgileri al
    const due = currentMonthlyDues.find(d => d.id === monthlyDueId);
    
    if (!due) {
        alert('Aidatı kaydı bulunamadı!');
        return;
    }

    // Modal açık kılıp daire bilgisini göster
    const residentLabel = document.getElementById('residentLabel');
    residentLabel.textContent = `Daire: ${due.user.block_no}-${due.user.apartment_no} - ${due.user.full_name}`;
    
    // Ödeme yöntemi select'ini sıfırla
    document.getElementById('recordPaymentMethod').value = '';
    
    // Ödemeyi kaydet verilerini sakla
    pendingPaymentData = {
        monthlyDueId: monthlyDueId,
        userId: userId
    };
    
    // Modal'ı aç
    document.getElementById('recordPaymentModal').classList.add('show');
}

// Form submit: Ödemeyi kaydet
async function submitRecordPayment(e) {
    e.preventDefault();

    if (!pendingPaymentData) {
        alert('Hata: Ödeme verileri bulunamadı!');
        return;
    }

    const paymentMethod = document.getElementById('recordPaymentMethod').value;

    if (!paymentMethod) {
        alert('Lütfen ödeme yöntemini seçin!');
        return;
    }

    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };

    try {
        const response = await fetch(`${API_BASE_URL}/payments/monthly/record-payment`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                monthlyDueId: pendingPaymentData.monthlyDueId,
                payment_method: paymentMethod
            })
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        alert('✅ Ödeme başarıyla kaydedildi!');
        document.getElementById('recordPaymentModal').classList.remove('show');
        document.getElementById('recordPaymentForm').reset();
        pendingPaymentData = null;
        
        await loadMonthlyData();

    } catch (error) {
        alert('❌ Hata: ' + error.message);
    }
}


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
