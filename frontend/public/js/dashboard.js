// ===============================
// Dashboard.js
// ===============================
const BASE_URL = 'http://localhost:3000';
const API_BASE = '/api/sites';

// Kullanıcı ve site bilgilerini al
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));
const token = localStorage.getItem('authToken');
const siteId = selectedSite?.site_id;

// ===============================
// Sayfa yüklendiğinde çalışacak
// ===============================
document.addEventListener('DOMContentLoaded', async () => {
    if (!currentUser || !selectedSite) {
        window.location.href = 'site-selection.html';
        return;
    }

    // Başlık ve kullanıcı bilgisi
    const dashboardTitle = document.getElementById('dashboard-title');
    const userInfo = document.getElementById('dashboard-user-info');
    if (dashboardTitle) dashboardTitle.textContent = `Ana Sayfa - ${selectedSite.site_name}`;
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
            window.location.href = 'site-selection.html';
        });
    }

    // Dashboard verilerini yükle
    await loadDashboardData();
});

// ===============================
// API yardımcı fonksiyon
// ===============================
async function apiRequest(endpoint) {
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    try {
        const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
        const data = await res.json();
        return { ok: res.ok, data };
    } catch (err) {
        console.error('API hatası:', err);
        return { ok: false, data: { message: 'Bağlantı hatası' } };
    }
}

// ===============================
// Dashboard verilerini çek
// ===============================
async function loadDashboardData() {
    try {
        const [occupancy, dues, announcements, requests] = await Promise.all([
            apiRequest(`${API_BASE}/${siteId}/occupancy`),
            apiRequest(`${API_BASE}/${siteId}/dues`),
            apiRequest(`${API_BASE}/${siteId}/announcements`),
            apiRequest(`${API_BASE}/${siteId}/requests`)
        ]);

        // Kart değerleri
        document.querySelector('#occupancy-card .card-value').textContent =
            occupancy.ok ? `${occupancy.data.percentage || 0}%` : '--%';
        document.querySelector('#dues-card .card-value').textContent =
            dues.ok ? `${dues.data.percentage || 0}%` : '--%';
        document.querySelector('#announcement-card .card-value').textContent =
            announcements.ok ? (announcements.data.count || 0) : '--';
        document.querySelector('#requests-card .card-value').textContent =
            requests.ok ? (requests.data.count || 0) : '--';

        // Son duyuruları yükle
        await loadRecentAnnouncements();

    } catch (error) {
        console.error('Dashboard yüklenemedi:', error);
    }
}

// ===============================
// Son 3 duyuruyu göster
// ===============================
async function loadRecentAnnouncements() {
    const announcementsContainer = document.getElementById('current-announcements');
    announcementsContainer.innerHTML = `<p style="text-align:center;padding:15px;color:#7f8c8d;">Yükleniyor...</p>`;

    const res = await apiRequest(`${API_BASE}/${siteId}/announcements/recent?limit=3`);

    if (!res.ok || !res.data || !res.data.announcements) {
        announcementsContainer.innerHTML = `<p style="text-align:center;padding:15px;color:#e74c3c;">Duyurular yüklenemedi.</p>`;
        return;
    }

    const list = res.data.announcements;
    if (list.length === 0) {
        announcementsContainer.innerHTML = `<p style="text-align:center;padding:15px;color:#7f8c8d;">Henüz duyuru yok.</p>`;
        return;
    }

    announcementsContainer.innerHTML = list.map(a => {
        const colors = { normal: '#3498db', important: '#f39c12', urgent: '#e74c3c' };
        const color = colors[a.priority] || '#3498db';
        return `
        <div class="announcement-item" style="border-left:4px solid ${color};padding:12px;margin-bottom:10px;background:#f8f9fa;border-radius:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-weight:600;color:#2c3e50;">${a.title}</div>
                    <div style="font-size:12px;color:#7f8c8d;">${new Date(a.start_date).toLocaleDateString('tr-TR')} - ${new Date(a.end_date).toLocaleDateString('tr-TR')}</div>
                    <div style="margin-top:5px;color:#34495e;">${a.content.substring(0, 100)}${a.content.length > 100 ? '...' : ''}</div>
                </div>
                <span style="font-size:11px;padding:3px 8px;background:${color};color:white;border-radius:3px;">
                    ${a.priority === 'urgent' ? 'ACİL' : a.priority === 'important' ? 'ÖNEMLİ' : 'NORMAL'}
                </span>
            </div>
        </div>`;
    }).join('');
}
