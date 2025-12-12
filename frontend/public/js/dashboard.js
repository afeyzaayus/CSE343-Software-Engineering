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
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        // Dashboard istatistiklerini tek endpoint'ten çek
        const response = await fetch(`${BASE_URL}/api/dashboard/statistics/${selectedSite.site_id}`, { 
            headers,
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Veri alınamadı');
        }

        const data = result.data;

        // Kartlara istatistikleri yaz
        const occupancyCard = document.querySelector('#occupancy-card .card-value');
        const occupancyFooter = document.querySelector('#occupancy-card .card-footer');
        if (occupancyCard) {
            occupancyCard.textContent = `${data.statistics.occupancy.percentage}%`;
            occupancyFooter.textContent = data.statistics.occupancy.display;
        }

        const duesCard = document.querySelector('#dues-card .card-value');
        const duesFooter = document.querySelector('#dues-card .card-footer');
        if (duesCard) {
            duesCard.textContent = `${data.statistics.dues.percentage}%`;
            duesFooter.textContent = data.statistics.dues.display;
        }

        const announcementCard = document.querySelector('#announcement-card .card-value');
        if (announcementCard) {
            announcementCard.textContent = data.statistics.announcements.active;
        }

        const requestsCard = document.querySelector('#requests-card .card-value');
        const requestsFooter = document.querySelector('#requests-card .card-footer');
        if (requestsCard) {
            requestsCard.textContent = data.statistics.requests.pending;
            requestsFooter.textContent = `${data.statistics.requests.total} toplam talep`;
        }

        // Son duyuruları göster
        displayRecentAnnouncements(data.recent_announcements);

    } catch (err) {
        console.error('Dashboard verisi yüklenemedi:', err);
        showError('Dashboard verileri yüklenirken bir hata oluştu.');
    }
}

// Son duyuruları göster
function displayRecentAnnouncements(announcements) {
    const container = document.getElementById('current-announcements');
    
    if (!announcements || announcements.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 15px; color: #7f8c8d;">Henüz duyuru yok</p>';
        return;
    }

    container.innerHTML = announcements.map(ann => `
        <div class="announcement-item">
            <div class="announcement-title">${ann.title}</div>
            <div class="announcement-content">${ann.content.substring(0, 100)}${ann.content.length > 100 ? '...' : ''}</div>
            <div class="announcement-date">${new Date(ann.created_at).toLocaleDateString('tr-TR')}</div>
        </div>
    `).join('');
}

// Hata mesajı göster
function showError(message) {
    const container = document.getElementById('current-announcements');
    if (container) {
        container.innerHTML = `<p style="text-align: center; padding: 15px; color: #e74c3c;">${message}</p>`;
    }
}
