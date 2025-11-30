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
        const options = { method, headers };
        if (data && method !== 'GET') options.body = JSON.stringify(data);

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
        dashboardTitle.textContent = `Duyurular`;
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
            window.location.href = 'admin-dashboard.html';
        });
    }

    // Duyuruları yükle
    setupAnnouncements();
    setupAnnouncementForm();
    setupEditForm();
});
async function setupAnnouncements() {
    if (!siteId) return;
    await loadAndRenderAnnouncements(siteId);
}

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

        renderActiveAnnouncements(active);
        renderPastAnnouncements(past);

    } catch (error) {
        console.error('Duyurular yüklenirken hata:', error);
    }
}

// -----------------------------------------
// API İşlemleri
// -----------------------------------------
async function fetchAnnouncements(siteId) {
    return await apiRequest(`${API_BASE}/${siteId}/announcements`, null, 'GET');
}

async function createAnnouncement(siteId, data) {
    return await apiRequest(`${API_BASE}/${siteId}/announcements`, data, 'POST');
}

async function updateAnnouncement(siteId, id, data) {
    return await apiRequest(`${API_BASE}/${siteId}/announcements/${id}`, data, 'PUT');
}

async function deleteAnnouncement(siteId, id) {
    return await apiRequest(`${API_BASE}/${siteId}/announcements/${id}`, null, 'DELETE');
}

// -----------------------------------------
// Render Fonksiyonları
// -----------------------------------------
function renderActiveAnnouncements(announcements) {
    const container = document.getElementById('current-announcements-list');
    if (!container) return;

    if (announcements.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#7f8c8d;">Aktif duyuru bulunmamaktadır.</p>';
        return;
    }

    container.innerHTML = announcements.map(a => {
        const colors = { normal: '#3498db', important: '#f39c12', urgent: '#e74c3c' };
        const color = colors[a.priority] || '#3498db';

        return `
        <div class="announcement-item" style="border-left:4px solid ${color};padding:15px;margin-bottom:15px;background:#f8f9fa;border-radius:4px;">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                        <h4 style="margin:0;color:#2c3e50;">${a.title}</h4>
                        <span style="font-size:11px;padding:3px 8px;background:${color};color:white;border-radius:3px;">
                            ${a.priority === 'urgent' ? 'ACİL' : a.priority === 'important' ? 'ÖNEMLİ' : 'NORMAL'}
                        </span>
                    </div>
                    <p style="margin:0 0 10px 0;color:#7f8c8d;">${a.content}</p>
                    <div style="font-size:12px;color:#95a5a6;">
                        <span><strong>Yayın:</strong> ${new Date(a.start_date).toLocaleDateString('tr-TR')}</span> | 
                        <span><strong>Bitiş:</strong> ${new Date(a.end_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
                <div style="display:flex;gap:5px;">
                    <button class="btn-edit" onclick="openEditModal(${a.id}, '${escapeHtml(a.title)}', '${escapeHtml(a.content)}', '${a.start_date}', '${a.end_date}', '${a.priority}')">Düzenle</button>
                    <button class="btn-delete" onclick="deleteAnnouncementHandler(${a.id})">Sil</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function renderPastAnnouncements(announcements) {
    const container = document.getElementById('past-announcements-list');
    if (!container) return;

    if (announcements.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#7f8c8d;">Geçmiş duyuru bulunmamaktadır.</p>';
        return;
    }

    container.innerHTML = announcements.map(a => `
        <div class="announcement-item" style="border-left:4px solid #95a5a6;padding:15px;margin-bottom:15px;background:#ecf0f1;border-radius:4px;opacity:0.8;">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <div style="flex:1;">
                    <h4 style="margin:0 0 10px 0;color:#2c3e50;">${a.title}</h4>
                    <p style="margin:0 0 10px 0;color:#7f8c8d;">${a.content}</p>
                    <div style="font-size:12px;color:#95a5a6;">
                        <span><strong>Yayın:</strong> ${new Date(a.start_date).toLocaleDateString('tr-TR')}</span> | 
                        <span><strong>Bitiş:</strong> ${new Date(a.end_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
                <div><button class="btn-delete" onclick="deleteAnnouncementHandler(${a.id})">Sil</button></div>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// -----------------------------------------
// Yeni Duyuru Ekleme
// -----------------------------------------
function setupAnnouncementForm() {
    const form = document.getElementById('announcementForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('announcementTitle').value;
        const content = document.getElementById('announcementContent').value;
        const startDate = new Date().toISOString().split('T')[0];
        const endDate = document.getElementById('announcementExpiry').value;
        const priority = document.getElementById('announcementPriority').value;

        if (!title || !content || !startDate || !endDate) {
            alert('Tüm alanları doldurun!');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            alert('Yayın tarihi bitişten sonra olamaz!');
            return;
        }

        const data = { title, content, start_date: startDate, end_date: endDate, priority };

        const response = await createAnnouncement(siteId, data);
        if (response.ok) {
            alert('Duyuru başarıyla eklendi!');
            form.reset();
            await loadAndRenderAnnouncements(siteId);
        } else {
            alert('Duyuru eklenemedi: ' + (response.data.message || 'Hata'));
        }
    });
}

// -----------------------------------------
// Düzenleme Modal ve Form
// -----------------------------------------
window.openEditModal = function (id, title, content, startDate, endDate, priority) {
    const modal = document.getElementById('editModal');
    document.getElementById('editAnnouncementId').value = id;
    document.getElementById('editAnnouncementTitle').value = title;
    document.getElementById('editAnnouncementContent').value = content;
    document.getElementById('editAnnouncementDate').value = startDate.split('T')[0];
    document.getElementById('editAnnouncementExpiry').value = endDate.split('T')[0];
    document.getElementById('editAnnouncementPriority').value = priority || 'normal';
    modal.style.display = 'flex';
};

window.closeEditModal = function () {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editAnnouncementForm').reset();
};

function setupEditForm() {
    const form = document.getElementById('editAnnouncementForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('editAnnouncementId').value;
        const title = document.getElementById('editAnnouncementTitle').value.trim();
        const content = document.getElementById('editAnnouncementContent').value.trim();
        const startDate = document.getElementById('editAnnouncementDate').value;
        const endDate = document.getElementById('editAnnouncementExpiry').value;
        const priority = document.getElementById('editAnnouncementPriority').value;

        if (!title || !content) {
            alert('Başlık ve içerik boş olamaz!');
            return;
        }

        const data = { title, content, start_date: startDate, end_date: endDate, priority };
        const response = await updateAnnouncement(siteId, id, data);

        if (response.ok) {
            alert('Duyuru güncellendi!');
            closeEditModal();
            await loadAndRenderAnnouncements(siteId);
        } else {
            alert('Güncelleme başarısız: ' + (response.data.message || 'Hata'));
        }
    });
}

// -----------------------------------------
// Silme
// -----------------------------------------
window.deleteAnnouncementHandler = async function (id) {
    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) return;

    const response = await deleteAnnouncement(siteId, id);
    if (response.ok) {
        alert('Duyuru silindi!');
        await loadAndRenderAnnouncements(siteId);
    } else {
        alert('Silme başarısız: ' + (response.data.message || 'Hata'));
    }
};