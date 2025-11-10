const BASE_URL = 'http://localhost:3000';

// LocalStorage'dan admin ve site bilgilerini al
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));

document.addEventListener('DOMContentLoaded', () => {
    if (!currentUser || !selectedSite) {
        // Kullanıcı veya site seçimi yoksa site seçim sayfasına yönlendir
        window.location.href = 'site-selection.html';
        return;
    }

    // Dashboard başlığı
    const dashboardTitle = document.getElementById('dashboard-title');
    if (dashboardTitle) {
        dashboardTitle.textContent = `Ana Sayfa - ${selectedSite.site_name}`;
    }

    // Sağ üst köşe admin bilgisi
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

    // Logout işlemi - site-selection.html'e yönlendir
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Sadece selectedSite'ı temizle, currentUser ve token kalsın
            localStorage.removeItem('selectedSite');
            // Site seçim sayfasına yönlendir
            window.location.href = 'site-selection.html';
        });
    }

    // Dashboard verilerini yükle
    loadDashboardData();
});

// Dashboard verilerini API'den çek
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('Token bulunamadı');
            return;
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Örnek API çağrıları
        const occupancyRes = await fetch(`${BASE_URL}/api/sites/${selectedSite.site_id}/occupancy`, { headers });
        const duesRes = await fetch(`${BASE_URL}/api/sites/${selectedSite.site_id}/dues`, { headers });
        const announcementsRes = await fetch(`${BASE_URL}/api/sites/${selectedSite.site_id}/announcements`, { headers });
        const requestsRes = await fetch(`${BASE_URL}/api/sites/${selectedSite.site_id}/requests`, { headers });

        // JSON
        const occupancy = occupancyRes.ok ? (await occupancyRes.json()).percentage || '--' : '--';
        const dues = duesRes.ok ? (await duesRes.json()).percentage || '--' : '--';
        const announcements = announcementsRes.ok ? (await announcementsRes.json()).count || '--' : '--';
        const requests = requestsRes.ok ? (await requestsRes.json()).count || '--' : '--';

        // Kartlara yaz
        const occupancyValue = document.getElementById('occupancy-value');
        const duesValue = document.getElementById('dues-value');
        const announcementValue = document.getElementById('announcement-value');
        const requestsValue = document.getElementById('requests-value');

        if (occupancyValue) occupancyValue.textContent = occupancy + '%';
        if (duesValue) duesValue.textContent = dues + '%';
        if (announcementValue) announcementValue.textContent = announcements;
        if (requestsValue) requestsValue.textContent = requests;

        // Duyurular bölümünü güncelle
        await loadRecentAnnouncements(token);

    } catch (err) {
        console.error('Dashboard verisi yüklenemedi:', err);
    }
}

// Son duyuruları yükle
async function loadRecentAnnouncements(token) {
    try {
        const response = await fetch(`${BASE_URL}/api/sites/${selectedSite.site_id}/announcements/recent?limit=3`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const announcementsContainer = document.getElementById('current-announcements');
            
            if (announcementsContainer) {
                if (data.announcements && data.announcements.length > 0) {
                    announcementsContainer.innerHTML = data.announcements.map(announcement => `
                        <div class="announcement-item">
                            <div class="announcement-title">${announcement.title}</div>
                            <div class="announcement-date">${new Date(announcement.date).toLocaleDateString('tr-TR')}</div>
                            <div class="announcement-preview">${announcement.content.substring(0, 100)}...</div>
                        </div>
                    `).join('');
                } else {
                    announcementsContainer.innerHTML = '<p style="text-align: center; padding: 15px; color: #7f8c8d;">Henüz duyuru bulunmuyor.</p>';
                }
            }
        }
    } catch (err) {
        console.error('Duyurular yüklenemedi:', err);
        const announcementsContainer = document.getElementById('current-announcements');
        if (announcementsContainer) {
            announcementsContainer.innerHTML = '<p style="text-align: center; padding: 15px; color: #e74c3c;">Duyurular yüklenirken bir hata oluştu.</p>';
        }
    }
}