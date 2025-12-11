// Payment Page Script
const API_BASE_URL = 'http://localhost:3000/api';
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));
const SITE_ID = selectedSite?.site_id;
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

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
        dashboardTitle.textContent = `Ödemeler - ${selectedSite.site_name}`;
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
});

// Ödemeleri API'den çek
async function loadPayments() {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    try {
        const response = await fetch(`${API_BASE_URL}/payments?siteId=${SITE_ID}`, { headers });
        if (!response.ok) throw new Error('Ödemeler yüklenemedi');
        
        const result = await response.json();
        const payments = result.data || result.payments || [];
        
        renderPayments(payments);
    } catch (error) {
        console.error('Ödemeler yüklenirken hata:', error);
        alert('Ödemeler yüklenirken bir hata oluştu.');
    }
}

// Ödemeleri render et
function renderPayments(payments) {
    const container = document.getElementById('payments-list');
    if (!container) return;

    if (payments.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#7f8c8d;">Henüz ödeme kaydı bulunmamaktadır.</p>';
        return;
    }

    container.innerHTML = payments.map(payment => {
        const statusColor = payment.status === 'PAID' ? '#27ae60' : payment.status === 'PENDING' ? '#f39c12' : '#e74c3c';
        const statusText = payment.status === 'PAID' ? 'ÖDENDİ' : payment.status === 'PENDING' ? 'BEKLİYOR' : 'GECİKMİŞ';

        return `
        <div class="payment-item" style="border-left:4px solid ${statusColor};padding:15px;margin-bottom:15px;background:#f8f9fa;border-radius:4px;">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <div style="flex:1;">
                    <h4 style="margin:0 0 10px 0;color:#2c3e50;">${payment.description || 'Ödeme'}</h4>
                    <p style="margin:0 0 10px 0;color:#7f8c8d;">
                        <strong>Tutar:</strong> ${payment.amount} TL
                    </p>
                    <div style="font-size:12px;color:#95a5a6;">
                        <span><strong>Vade:</strong> ${new Date(payment.due_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
                <div>
                    <span style="font-size:11px;padding:5px 10px;background:${statusColor};color:white;border-radius:3px;">
                        ${statusText}
                    </span>
                </div>
            </div>
        </div>`;
    }).join('');
}
