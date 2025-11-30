// dashboard.js
const BASE_URL = 'http://localhost:3000';

// LocalStorage'dan admin ve site bilgilerini al
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));

document.addEventListener('DOMContentLoaded', () => {
    if (!currentUser || !selectedSite) {
        // Kullanıcı veya site seçimi yoksa login sayfasına yönlendir
        window.location.href = 'login.html';
        return;
    }

    // Dashboard başlığı
    const dashboardTitle = document.getElementById('dashboard-title');
    dashboardTitle.textContent = `Ana Sayfa - ${selectedSite.site_name}`;

    // Sağ üst köşe admin bilgisi
    const userInfo = document.getElementById('dashboard-user-info');
    userInfo.innerHTML = `
        <div class="user-avatar">${(currentUser.full_name || 'A')[0].toUpperCase()}</div>
        <div style="margin-left: 10px;">
            <div style="font-weight: 600;">${currentUser.full_name}</div>
            <div style="font-size: 12px; opacity: 0.8;">${currentUser.account_type}</div>
        </div>
    `;

    // Logout işlemi
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('selectedSite');
        window.location.href = 'admin-dashboard.html';
    });

    // Dashboard verilerini yükle
    loadDashboardData();
});

// Dashboard verilerini API'den çek
async function loadDashboardData() {
    try {
        // Örnek API çağrıları
        const occupancyRes = await fetch(`${BASE_URL}/api/sites/${selectedSite.site_id}/occupancy`);
        const duesRes = await fetch(`${BASE_URL}/api/sites/${selectedSite.site_id}/dues`);
        const announcementsRes = await fetch(`${BASE_URL}/api/sites/${selectedSite.site_id}/announcements`);
        const requestsRes = await fetch(`${BASE_URL}/api/sites/${selectedSite.site_id}/requests`);

        // JSON
        const occupancy = (await occupancyRes.json()).percentage || '--';
        const dues = (await duesRes.json()).percentage || '--';
        const announcements = (await announcementsRes.json()).count || '--';
        const requests = (await requestsRes.json()).count || '--';

        // Kartlara yaz
        document.getElementById('occupancy-value').textContent = occupancy + '%';
        document.getElementById('dues-value').textContent = dues + '%';
        document.getElementById('announcement-value').textContent = announcements;
        document.getElementById('requests-value').textContent = requests;

    } catch (err) {
        console.error('Dashboard verisi yüklenemedi:', err);
    }
}
