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
let allResidents = [];  // Tüm sakinler
let allApartments = [];  // Tüm daireler (daire bazında ödeme için)
let currentMonthlyDues = [];
let pendingPaymentData = null;
let selectedApartmentForPayment = null;  // Modal'da seçilen daire
function getRoleText(role) {
    const roleMap = {
        'COMPANY_MANAGER': 'Şirket Yöneticisi',
        'COMPANY_EMPLOYEE': 'Şirket Çalışanı',
        'INDIVIDUAL': 'Bireysel Hesap',
    };
    return roleMap[role] || role;
}
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
                <div style="font-size: 12px; opacity: 0.8;">${getRoleText(currentUser.account_type)}</div>
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

        // Daireler listesini oluştur (unique daireler)
        buildApartmentsList();

        // Modal'da daireleri doldur
        fillApartmentSelect();

    } catch (error) {
        console.error('Hata:', error);
    }
}

// Daireleri unique olarak listele
function buildApartmentsList() {
    const apartmentsMap = new Map();
    
    allResidents.forEach(resident => {
        const key = `${resident.block_no}-${resident.apartment_no}`;
        if (!apartmentsMap.has(key)) {
            apartmentsMap.set(key, {
                block_no: resident.block_no,
                apartment_no: resident.apartment_no,
                residents: []
            });
        }
        apartmentsMap.get(key).residents.push(resident);
    });
    
    allApartments = Array.from(apartmentsMap.values());
}

// Daire seçim listesini doldur (modal'da)
function fillApartmentSelect() {
    const select = document.getElementById('paymentApartment');
    select.innerHTML = '<option value="">Daire seçin</option>';

    allApartments.forEach((apt, index) => {
        const option = document.createElement('option');
        option.value = index;
        const residentsNames = apt.residents.map(r => r.full_name).join(', ');
        option.textContent = `${apt.block_no}-${apt.apartment_no} (${residentsNames})`;
        select.appendChild(option);
    });
    
    // Daire seçim değişikliğini dinle
    select.addEventListener('change', onApartmentSelected);
}

// Daire seçildiğinde - o dairede yaşayan kişileri göster
function onApartmentSelected() {
    const select = document.getElementById('paymentApartment');
    const apartmentIndex = select.value;
    
    if (apartmentIndex === '') {
        document.getElementById('paymentPerson').innerHTML = '<option value="">Kişi seçin</option>';
        selectedApartmentForPayment = null;
        return;
    }
    
    selectedApartmentForPayment = allApartments[apartmentIndex];
    
    // O dairede yaşayan kişileri göster
    const personSelect = document.getElementById('paymentPerson');
    personSelect.innerHTML = '<option value="">Ödemeyi yapan kişiyi seçin</option>';
    
    selectedApartmentForPayment.residents.forEach(resident => {
        const option = document.createElement('option');
        option.value = resident.id;
        option.textContent = resident.full_name;
        personSelect.appendChild(option);
    });
}

// Özet güncelle (DAIRE BAZINDA - kişi bazında değil)
function updateSummary() {
    // Daire bazında unique sayıları hesapla
    const countUniqueApartments = (status) => {
        const uniqueApts = new Set();
        currentMonthlyDues
            .filter(d => d.payment_status === status)
            .forEach(d => {
                const key = `${d.user.block_no}-${d.user.apartment_no}`;
                uniqueApts.add(key);
            });
        return uniqueApts.size;
    };

    const paidCount = countUniqueApartments('PAID');
    const unpaidCount = countUniqueApartments('UNPAID');
    const overdueCount = countUniqueApartments('OVERDUE');

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
            <div class="summary-label">Ödenmiş Daire</div>
            <div class="summary-value">${paidCount}</div>
        </div>
        <div class="summary-card unpaid">
            <div class="summary-label">Ödenmemiş Daire</div>
            <div class="summary-value">${unpaidCount}</div>
        </div>
        <div class="summary-card overdue">
            <div class="summary-label">Vadesi Geçmiş Daire</div>
            <div class="summary-value">${overdueCount}</div>
        </div>
    `;

    document.getElementById('dueSummary').innerHTML = summaryHTML;
}

// Tabloları render et
function renderTables() {
    // Daire bazında grupla
    const paidDues = currentMonthlyDues.filter(d => d.payment_status === 'PAID');
    const unpaidDues = currentMonthlyDues.filter(d => d.payment_status === 'UNPAID');
    const overdueDues = currentMonthlyDues.filter(d => d.payment_status === 'OVERDUE');

    // Ödenmiş tablo (daire bazında unique)
    renderPaidTable(paidDues);

    // Ödenmemiş tablo (overdue bilgisini de göster)
    renderUnpaidTable(unpaidDues, overdueDues);

    // Overdue tablo
    renderOverdueTable(overdueDues);
}

// Ödenmiş tablosu (DAIRE BAZINDA - unique daireler)
function renderPaidTable(paid) {
    const tbody = document.querySelector('#paid-section tbody');
    
    if (paid.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Bu ayda henüz ödeme yapılmamış.</td></tr>';
        return;
    }

    // Daire bazında unique kayıtları göster
    const uniqueApartments = new Map();
    paid.forEach(due => {
        const key = `${due.user.block_no}-${due.user.apartment_no}`;
        if (!uniqueApartments.has(key)) {
            uniqueApartments.set(key, due);
        }
    });

    tbody.innerHTML = Array.from(uniqueApartments.values()).map(due => {
        const paidDate = new Date(due.paid_date).toLocaleDateString('tr-TR');
        const paidByName = due.paid_by_user?.full_name || due.user.full_name;
        return `
            <tr>
                <td><strong>${due.user.block_no}-${due.user.apartment_no}</strong></td>
                <td>${paidByName}</td>
                <td>${paidDate}</td>
                <td>${due.amount} TL</td>
                <td>${due.payment_method || '-'}</td>
                <td><span class="status-badge paid">Ödendi</span></td>
            </tr>
        `;
    }).join('');
}

// Ödenmemiş tablosu (DAIRE BAZINDA)
function renderUnpaidTable(unpaid, overdue) {
    const tbody = document.querySelector('#unpaid-section tbody');
    
    if (unpaid.length === 0) {
        if (overdue.length > 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ff9800;">Bu ayda yeni ödenmemiş aidatı yok (tüm aidatlar vadesi geçmiştir)</td></tr>';
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Bu ay için kayıt bulunamadı.</td></tr>';
        }
        return;
    }

    // Daire bazında unique kayıtları göster
    const uniqueApartments = new Map();
    unpaid.forEach(due => {
        const key = `${due.user.block_no}-${due.user.apartment_no}`;
        if (!uniqueApartments.has(key)) {
            uniqueApartments.set(key, due);
        }
    });

    tbody.innerHTML = Array.from(uniqueApartments.values()).map(due => {
        const dueDate = new Date(due.due_date).toLocaleDateString('tr-TR');
        // O dairede yaşayan insanları listele
        const residentsInApartment = unpaid.filter(d => 
            d.user.block_no === due.user.block_no && 
            d.user.apartment_no === due.user.apartment_no
        );
        const residentsNames = residentsInApartment.map(r => r.user.full_name).join(', ');
        
        return `
            <tr>
                <td><strong>${due.user.block_no}-${due.user.apartment_no}</strong></td>
                <td>${residentsNames}</td>
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

// Overdue tablosu (DAIRE BAZINDA)
function renderOverdueTable(overdue) {
    const tbody = document.querySelector('#overdue-section tbody');
    
    if (overdue.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Vadesi geçmiş aidatı yok.</td></tr>';
        return;
    }

    // Daire bazında unique kayıtları göster
    const uniqueApartments = new Map();
    overdue.forEach(due => {
        const key = `${due.user.block_no}-${due.user.apartment_no}`;
        if (!uniqueApartments.has(key)) {
            uniqueApartments.set(key, due);
        }
    });

    tbody.innerHTML = Array.from(uniqueApartments.values()).map(due => {
        const dueDate = new Date(due.due_date);
        const today = new Date();
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        
        // O dairede yaşayan insanları listele
        const residentsInApartment = overdue.filter(d => 
            d.user.block_no === due.user.block_no && 
            d.user.apartment_no === due.user.apartment_no
        );
        const residentsNames = residentsInApartment.map(r => r.user.full_name).join(', ');

        return `
            <tr>
                <td><strong>${due.user.block_no}-${due.user.apartment_no}</strong></td>
                <td>${residentsNames}</td>
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

// Ödemeyi kaydet (UNPAID -> PAID) - DAIRE BAZINDA
async function recordPayment(monthlyDueId, userId) {
    // Modal'da görüntülenecek bilgileri al
    const due = currentMonthlyDues.find(d => d.id === monthlyDueId);
    
    if (!due) {
        alert('Aidatı kaydı bulunamadı!');
        return;
    }

    // Modal açık kılıp daire bilgisini göster
    const residentLabel = document.getElementById('residentLabel');
    residentLabel.textContent = `Daire: ${due.user.block_no}-${due.user.apartment_no}`;
    
    // O dairede yaşayan tüm kişileri bul
    const residentsInApartment = allResidents.filter(r => 
        r.block_no === due.user.block_no && 
        r.apartment_no === due.user.apartment_no
    );
    
    // Kişi dropdown'unu doldur
    const personSelect = document.getElementById('recordPaymentPerson');
    personSelect.innerHTML = '<option value="">Ödemeyi yapan kişiyi seçin</option>';
    residentsInApartment.forEach(resident => {
        const option = document.createElement('option');
        option.value = resident.id;
        option.textContent = resident.full_name;
        if (resident.id === userId) {
            option.selected = true;  // Default olarak mevcut kişiyi seç
        }
        personSelect.appendChild(option);
    });
    
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
    const paid_by_user_id = document.getElementById('recordPaymentPerson')?.value;
    const paymentAmount = document.getElementById('recordPaymentAmount')?.value;

    if (!paymentMethod) {
        alert('Lütfen ödeme yöntemini seçin!');
        return;
    }

    if (!paid_by_user_id) {
        alert('Lütfen ödemeyi yapan kişiyi seçin!');
        return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
        alert('Lütfen geçerli bir tutar girin!');
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
                payment_method: paymentMethod,
                paid_by_user_id: parseInt(paid_by_user_id),
                amount: parseFloat(paymentAmount)  // Tutar bilgisi
            })
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        // Ödemeyi yapan kişinin adını al
        const paidByName = document.getElementById('recordPaymentPerson').selectedOptions[0].text;
        
        alert(`✅ Ödeme başarıyla kaydedildi!\n`);
        document.getElementById('recordPaymentModal').classList.remove('show');
        document.getElementById('recordPaymentForm').reset();
        pendingPaymentData = null;
        
        // Verileri tamamen yenile
        await loadResidents();
        await loadMonthlyData();

    } catch (error) {
        alert('❌ Hata: ' + error.message);
    }
}


     // Logout
     const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('selectedSite');
            window.location.href = 'admin-dashboard.html';
        });
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