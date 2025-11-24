// Payment API URL'leri
const API_BASE_URL = 'http://localhost:3000/api';

// Geçici: Site ID'yi localStorage'dan veya sabit olarak alıyoruz
const SITE_ID = 1; // Gerçek uygulamada sessionStorage'dan gelecek

// Sayfa yüklendiğinde çalışacak
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupEventListeners();
});

// Tüm verileri yükle ve tabloları doldur
async function loadData() {
    try {
        // Hem sakinleri hem ödemeleri paralel yükle
        const [residents, payments] = await Promise.all([
            fetchResidents(),
            fetchPayments()
        ]);

        // Ödeme yapanları tabloya ekle
        populatePaidTable(payments);

        // Ödeme yapmayanları bul ve tabloya ekle
        const paidUserIds = new Set(payments.map(p => p.userId));
        const unpaidResidents = residents.filter(r => !paidUserIds.has(r.id));
        populateUnpaidTable(unpaidResidents);

        // Dropdown'ı doldur (sadece ödeme yapmayanlar)
        populateResidentDropdown(unpaidResidents);

    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        alert('Veriler yüklenirken bir hata oluştu.');
    }
}

// Site sakinlerini API'den çek
async function fetchResidents() {
    const response = await fetch(`${API_BASE_URL}/payments/site/${SITE_ID}/residents`);
    if (!response.ok) throw new Error('Site sakinleri yüklenemedi');
    const result = await response.json();
    return result.data;
}

// Ödemeleri API'den çek
async function fetchPayments() {
    const response = await fetch(`${API_BASE_URL}/payments/site/${SITE_ID}`);
    if (!response.ok) throw new Error('Ödemeler yüklenemedi');
    const result = await response.json();
    return result.data;
}

// Dropdown'ı site sakinleriyle doldur
function populateResidentDropdown(residents) {
    const selectElement = document.getElementById('paymentApartment');
    selectElement.innerHTML = '<option value="">Daire seçin</option>';
    
    if (residents.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Tüm sakinler ödeme yaptı!';
        option.disabled = true;
        selectElement.appendChild(option);
        return;
    }
    
    residents.forEach(resident => {
        const option = document.createElement('option');
        option.value = resident.id;
        option.textContent = `${resident.block_no}-${resident.apartment_no} - ${resident.full_name}`;
        option.dataset.blockNo = resident.block_no;
        option.dataset.apartmentNo = resident.apartment_no;
        option.dataset.fullName = resident.full_name;
        option.dataset.phone = resident.phone_number;
        selectElement.appendChild(option);
    });
}

// Ödeme yapanları tabloya ekle
function populatePaidTable(payments) {
    const tbody = document.querySelector('#paid-section tbody');
    tbody.innerHTML = '';

    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Henüz ödeme yapan yok</td></tr>';
        return;
    }

    payments.forEach(payment => {
        const tr = document.createElement('tr');
        
        const paymentMethodText = {
            'CASH': 'Nakit',
            'CREDIT_CARD': 'Kredi Kartı',
            'BANK_TRANSFER': 'Banka',
            'CHECK': 'Çek',
            'OTHER': 'Diğer'
        }[payment.payment_method] || payment.payment_method;

        const paymentDate = new Date(payment.payment_date).toLocaleDateString('tr-TR');

        tr.innerHTML = `
            <td>${payment.user.block_no}-${payment.user.apartment_no}</td>
            <td>${payment.user.full_name}</td>
            <td>${paymentDate}</td>
            <td>${payment.amount} TL</td>
            <td><span class="status paid">${paymentMethodText}</span></td>
        `;
        
        tbody.appendChild(tr);
    });

    // Başlık güncelle
    document.querySelector('#paid-section .table-subtitle').textContent = 
        `${payments.length} ödeme kaydı`;
}

// Ödemeyenleri tabloya ekle (Tüm sakinler - Ödeme yapanlar)
function populateUnpaidTable(unpaidResidents) {
    const tbody = document.querySelector('#unpaid-section tbody');
    tbody.innerHTML = '';

    if (unpaidResidents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Tüm site sakinleri ödeme yaptı! 🎉</td></tr>';
        return;
    }

    // Mevcut ayın son günü
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const lastDayFormatted = lastDayOfMonth.toLocaleDateString('tr-TR');

    unpaidResidents.forEach(resident => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${resident.block_no}-${resident.apartment_no}</td>
            <td>${resident.full_name}</td>
            <td>${resident.phone_number || 'Yok'}</td>
            <td>${lastDayFormatted}</td>
            <td><span class="status unpaid">Ödeme bekleniyor</span></td>
        `;
        
        tbody.appendChild(tr);
    });

    // Başlık güncelle
    document.querySelector('#unpaid-section .table-subtitle').textContent = 
        `${unpaidResidents.length} kişi ödeme yapmadı`;
}

// Event listener'ları ayarla
function setupEventListeners() {
    // Modal açma
    const addPaymentBtn = document.getElementById('addPaymentBtn');
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', () => {
            document.getElementById('addPaymentModal').style.display = 'flex';
        });
    }

    // Modal kapatma
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('addPaymentModal').style.display = 'none';
        });
    }

    // Form gönderme
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }

    // Bugünün tarihini varsayılan yap
    const paymentDateInput = document.getElementById('paymentDate');
    if (paymentDateInput) {
        paymentDateInput.valueAsDate = new Date();
    }
}

// Ödeme formu gönderildiğinde
async function handlePaymentSubmit(e) {
    e.preventDefault();

    const userId = document.getElementById('paymentApartment').value;
    const amount = document.getElementById('paymentAmount').value;
    const payment_date = document.getElementById('paymentDate').value;
    const payment_method = document.getElementById('paymentType').value.toUpperCase();

    // Ödeme yöntemini enum'a dönüştür
    const paymentMethodMap = {
        'NAKIT': 'CASH',
        'BANKA': 'BANK_TRANSFER',
        'KREDI': 'CREDIT_CARD'
    };

    const paymentData = {
        userId: parseInt(userId),
        siteId: SITE_ID,
        amount: parseFloat(amount),
        payment_date,
        payment_method: paymentMethodMap[payment_method] || 'OTHER',
        description: 'Aidat ödemesi'
    };

    try {
        const response = await fetch(`${API_BASE_URL}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Ödeme kaydedilemedi');
        }

        alert('✅ Ödeme başarıyla kaydedildi!');
        document.getElementById('addPaymentModal').style.display = 'none';
        document.getElementById('paymentForm').reset();
        
        // Tabloları yeniden yükle
        await loadData();

    } catch (error) {
        console.error('Ödeme kaydetme hatası:', error);
        alert('❌ Ödeme kaydedilirken bir hata oluştu: ' + error.message);
    }
}

// Belirli bir sakin için ödeme modalını aç
function openPaymentModal(userId) {
    document.getElementById('addPaymentModal').style.display = 'flex';
    document.getElementById('paymentApartment').value = userId;
}

// Makbuz görüntüle
function viewReceipt(paymentId) {
    alert(`Makbuz görüntüleme özelliği yakında eklenecek. Ödeme ID: ${paymentId}`);
}
