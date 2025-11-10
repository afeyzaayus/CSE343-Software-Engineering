// js/modules/announcement.js - Standalone Version
const BASE_URL = 'http://localhost:3000';
const API_BASE = '/api/sites';

// Kullanıcı ve seçili site bilgisi localStorage'dan
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));
const siteId = selectedSite?.site_id;

// -----------------------------------------
// API Request Helper
// -----------------------------------------
async function apiRequest(endpoint, data = null, method = 'GET') {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('authToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const options = {
            method,
            headers
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const result = await response.json();
        return { ok: response.ok, data: result };
    } catch (error) {
        console.error('API Hatası:', error);
        return { ok: false, data: { message: 'Bağlantı hatası' } };
    }
}

// -----------------------------------------
// DOMContentLoaded: dashboard başlığı, logout, veri yükleme
// -----------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    if (!currentUser || !selectedSite) {
        window.location.href = 'login.html';
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
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('selectedSite');
            window.location.href = 'site-selection.html';
        });
    }

    // Duyuruları yükle
    setupAnnouncements();
    
    // Form event listener'ları
    setupAnnouncementForm();
    setupEditForm();
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
        
        if (!response.ok) {
            console.error('Duyurular yüklenemedi:', response.data.message);
            return;
        }

        const announcements = response.data.announcements || response.data || [];
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
    return await apiRequest(`${API_BASE}/${siteId}/announcements`, null, 'GET');
}

/**
 * API: Create announcement
 */
async function createAnnouncement(siteId, announcementData) {
    return await apiRequest(`${API_BASE}/${siteId}/announcements`, announcementData, 'POST');
}

/**
 * API: Update announcement
 */
async function updateAnnouncement(siteId, announcementId, announcementData) {
    return await apiRequest(`${API_BASE}/${siteId}/announcements/${announcementId}`, announcementData, 'PUT');
}

/**
 * API: Delete announcement
 */
async function deleteAnnouncement(siteId, announcementId) {
    return await apiRequest(`${API_BASE}/${siteId}/announcements/${announcementId}`, null, 'DELETE');
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

    container.innerHTML = announcements.map(a => {
        const priorityColors = {
            normal: '#3498db',
            important: '#f39c12',
            urgent: '#e74c3c'
        };
        const borderColor = priorityColors[a.priority] || '#3498db';
        
        return `
        <div class="announcement-item" style="border-left: 4px solid ${borderColor}; padding: 15px; margin-bottom: 15px; background: #f8f9fa; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: #2c3e50;">${a.title}</h4>
                        <span style="font-size: 11px; padding: 3px 8px; background: ${borderColor}; color: white; border-radius: 3px;">${a.priority === 'urgent' ? 'ACİL' : a.priority === 'important' ? 'ÖNEMLİ' : 'NORMAL'}</span>
                    </div>
                    <p style="margin: 0 0 10px 0; color: #7f8c8d;">${a.content}</p>
                    <div style="font-size: 12px; color: #95a5a6;">
                        <span><strong>Yayın:</strong> ${new Date(a.start_date).toLocaleDateString('tr-TR')}</span> | 
                        <span><strong>Bitiş:</strong> ${new Date(a.end_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-edit" onclick="openEditModal(${a.id}, '${escapeHtml(a.title)}', '${escapeHtml(a.content)}', '${a.start_date}', '${a.end_date}', '${a.priority}')">Düzenle</button>
                    <button class="btn-delete" onclick="deleteAnnouncementHandler(${a.id})">Sil</button>
                </div>
            </div>
        </div>
    `;
    }).join('');
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
                        <span><strong>Yayın:</strong> ${new Date(a.start_date).toLocaleDateString('tr-TR')}</span> | 
                        <span><strong>Bitiş:</strong> ${new Date(a.end_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
                <div>
                    <button class="btn-delete" onclick="deleteAnnouncementHandler(${a.id})">Sil</button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// -----------------------------------------
// Yeni Duyuru Form Setup
// -----------------------------------------
function setupAnnouncementForm() {
    const announcementForm = document.getElementById('announcementForm');
    if (!announcementForm) return;

    announcementForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('announcementTitle');
        const content = document.getElementById('announcementContent');
        const startDate = document.getElementById('announcementDate');
        const endDate = document.getElementById('announcementExpiry');
        const priority = document.getElementById('announcementPriority');

        // Validasyon
        if (!title.value.trim()) {
            alert('Başlık boş olamaz!');
            return;
        }

        if (!content.value.trim()) {
            alert('İçerik boş olamaz!');
            return;
        }

        if (!startDate.value || !endDate.value) {
            alert('Yayın ve bitiş tarihleri seçilmelidir!');
            return;
        }

        // Tarih kontrolü
        if (new Date(startDate.value) > new Date(endDate.value)) {
            alert('Yayın tarihi bitiş tarihinden sonra olamaz!');
            return;
        }

        const formData = {
            title: title.value.trim(),
            content: content.value.trim(),
            start_date: startDate.value,
            end_date: endDate.value,
            priority: priority.value
        };

        try {
            const response = await createAnnouncement(siteId, formData);
            
            if (response.ok) {
                alert('Duyuru başarıyla yayınlandı!');
                announcementForm.reset();
                await loadAndRenderAnnouncements(siteId);
            } else {
                alert('Duyuru eklenemedi: ' + (response.data.message || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error('Ekleme hatası:', error);
            alert('Duyuru eklenemedi: ' + error.message);
        }
    });
}

// -----------------------------------------
// Düzenleme Form Setup
// -----------------------------------------
function setupEditForm() {
    const editForm = document.getElementById('editAnnouncementForm');
    if (!editForm) return;

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editAnnouncementId').value;
        const title = document.getElementById('editAnnouncementTitle');
        const content = document.getElementById('editAnnouncementContent');
        const startDate = document.getElementById('editAnnouncementDate');
        const endDate = document.getElementById('editAnnouncementExpiry');
        const priority = document.getElementById('editAnnouncementPriority');

        // Validasyon
        if (!title.value.trim()) {
            alert('Başlık boş olamaz!');
            return;
        }

        if (!content.value.trim()) {
            alert('İçerik boş olamaz!');
            return;
        }

        if (!startDate.value || !endDate.value) {
            alert('Yayın ve bitiş tarihleri seçilmelidir!');
            return;
        }

        // Tarih kontrolü
        if (new Date(startDate.value) > new Date(endDate.value)) {
            alert('Yayın tarihi bitiş tarihinden sonra olamaz!');
            return;
        }

        const formData = {
            title: title.value.trim(),
            content: content.value.trim(),
            start_date: startDate.value,
            end_date: endDate.value,
            priority: priority.value
        };

        try {
            const response = await updateAnnouncement(siteId, id, formData);
            
            if (response.ok) {
                alert('Duyuru başarıyla güncellendi!');
                closeEditModal();
                await loadAndRenderAnnouncements(siteId);
            } else {
                alert('Duyuru güncellenemedi: ' + (response.data.message || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error('Güncelleme hatası:', error);
            alert('Duyuru güncellenemedi: ' + error.message);
        }
    });
}

// -----------------------------------------
// Modal Fonksiyonları
// -----------------------------------------
window.openEditModal = function(id, title, content, startDate, endDate, priority) {
    const modal = document.getElementById('editModal');
    
    document.getElementById('editAnnouncementId').value = id;
    document.getElementById('editAnnouncementTitle').value = title;
    document.getElementById('editAnnouncementContent').value = content;
    document.getElementById('editAnnouncementDate').value = startDate.split('T')[0];
    document.getElementById('editAnnouncementExpiry').value = endDate.split('T')[0];
    document.getElementById('editAnnouncementPriority').value = priority || 'normal';
    
    modal.style.display = 'flex';
};

window.closeEditModal = function() {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
    document.getElementById('editAnnouncementForm').reset();
};

// Modal dışına tıklayınca kapat
document.addEventListener('click', (e) => {
    const modal = document.getElementById('editModal');
    if (e.target === modal) {
        closeEditModal();
    }
});

// -----------------------------------------
// Silme Fonksiyonu
// -----------------------------------------
window.deleteAnnouncementHandler = async function(announcementId) {
    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await deleteAnnouncement(siteId, announcementId);
        
        if (response.ok) {
            alert('Duyuru silindi!');
            await loadAndRenderAnnouncements(siteId);
        } else {
            alert('Duyuru silinemedi: ' + (response.data.message || 'Bilinmeyen hata'));
        }
    } catch (error) {
        console.error('Silme hatası:', error);
        alert('Duyuru silinemedi: ' + error.message);
    }
};