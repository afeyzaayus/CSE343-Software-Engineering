// js/modules/announcement.js
// js/modules/announcement.js
import { apiCall } from './api.js'; 

const API_BASE = '/sites'; 

// Kullanıcı ve seçili site bilgisi localStorage'dan
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));
const siteId = selectedSite?.site_id;

// -----------------------------------------
// DOMContentLoaded: dashboard başlığı, logout, veri yükleme
// -----------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    if (!currentUser || !selectedSite) {
        // Kullanıcı veya site seçimi yoksa login sayfasına yönlendir
        window.location.href = 'index.html';
        return;
    }

    // Dashboard başlığı
    const dashboardTitle = document.getElementById('dashboard-title');
    if (dashboardTitle) {
        dashboardTitle.textContent = `Duyurular - ${selectedSite.site_name}`;
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

    // Logout işlemi
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('selectedSite');
            sessionStorage.removeItem('siteId');
            window.location.href = 'index.html';
        });
    }

    // Duyuruları yükle
    setupAnnouncements();
});

async function setupAnnouncements() {
    if (!siteId) return;
    await loadAndRenderAnnouncements(siteId);
}

/**
 * Load announcements and render
 */
async function loadAndRenderAnnouncements(siteId) {
    try {
        const response = await fetchAnnouncements(siteId);
        const announcements = response.announcements || response || [];

        const active = announcements.active || [];
        const past = announcements.past || [];

        renderActiveAnnouncements(active, siteId);
        renderPastAnnouncements(past, siteId);

    } catch (error) {
        console.error('Duyurular yüklenirken hata:', error);
    }
}

/**
 * API: Get announcements
 */
async function fetchAnnouncements(siteId) {
    try {
        const res = await apiCall(`${API_BASE}/${siteId}/announcements`, 'GET', null, false);
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Duyurular alınamadı');
        }
        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}

/**
 * API: Create announcement
 */
async function createAnnouncement(siteId, announcementData) {
    try {
        const res = await apiCall(`${API_BASE}/${siteId}/announcements`, 'POST', announcementData, false);
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Duyuru eklenemedi');
        }
        return await res.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
}

/**
 * API: Update announcement
 */
async function updateAnnouncement(siteId, announcementId, announcementData) {
    try {
        const res = await apiCall(`${API_BASE}/${siteId}/announcements/${announcementId}`, 'PUT', announcementData, false);
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Duyuru güncellenemedi');
        }
        return await res.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
}

/**
 * API: Delete announcement
 */
async function deleteAnnouncement(siteId, announcementId) {
    try {
        const res = await apiCall(`${API_BASE}/${siteId}/announcements/${announcementId}`, 'DELETE', null, false);
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Duyuru silinemedi');
        }
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

/**
 * Render active announcements
 */
function renderActiveAnnouncements(announcements, siteId) {
    const container = document.getElementById('current-announcements-list');
    if (!container) return;

    if (announcements.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Aktif duyuru bulunmamaktadır.</p>';
        return;
    }

    container.innerHTML = announcements.map(a => `
        <div class="announcement-item" style="border-left: 4px solid #3498db; padding: 15px; margin-bottom: 15px; background: #f8f9fa; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 10px 0; color: #2c3e50;">${a.title}</h4>
                    <p style="margin: 0 0 10px 0; color: #7f8c8d;">${a.content}</p>
                    <div style="font-size: 12px; color: #95a5a6;">
                        <span><strong>Başlangıç:</strong> ${new Date(a.start_date).toLocaleDateString('tr-TR')}</span> | 
                        <span><strong>Bitiş:</strong> ${new Date(a.end_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-edit" onclick="editAnnouncement('${siteId}', ${a.id})">Düzenle</button>
                    <button class="btn-delete" onclick="deleteAnnouncementHandler('${siteId}', ${a.id})">Sil</button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Render past announcements
 */
function renderPastAnnouncements(announcements, siteId) {
    const container = document.getElementById('past-announcements-list');
    if (!container) return;

    if (announcements.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Geçmiş duyuru bulunmamaktadır.</p>';
        return;
    }

    container.innerHTML = announcements.map(a => `
        <div class="announcement-item" style="border-left: 4px solid #95a5a6; padding: 15px; margin-bottom: 15px; background: #ecf0f1; border-radius: 4px; opacity: 0.8;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 10px 0; color: #2c3e50;">${a.title}</h4>
                    <p style="margin: 0 0 10px 0; color: #7f8c8d;">${a.content}</p>
                    <div style="font-size: 12px; color: #95a5a6;">
                        <span><strong>Başlangıç:</strong> ${new Date(a.start_date).toLocaleDateString('tr-TR')}</span> | 
                        <span><strong>Bitiş:</strong> ${new Date(a.end_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
                <div>
                    <button class="btn-delete" onclick="deleteAnnouncementHandler('${siteId}', ${a.id})">Sil</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Global inline fonksiyonlar
window.deleteAnnouncementHandler = async function(siteId, announcementId) {
    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) return;
    try {
        await deleteAnnouncement(siteId, announcementId);
        alert('Duyuru silindi!');
        loadAndRenderAnnouncements(siteId);
    } catch (error) {
        console.error('Silme hatası:', error);
        alert('Duyuru silinemedi: ' + error.message);
    }
};

export { setupAnnouncements, fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };
