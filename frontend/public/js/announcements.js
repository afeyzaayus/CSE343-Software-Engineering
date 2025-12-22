// js/modules/announcement.js - Standalone Version
const BASE_URL = '';
const API_BASE = '/api/sites';

// Rol ismini Türkçe'ye çevir
function getRoleText(role) {
    const roleMap = {
        'COMPANY_MANAGER': 'Şirket Yöneticisi',
        'COMPANY_EMPLOYEE': 'Şirket Çalışanı',
        'INDIVIDUAL': 'Bireysel Hesap',
    };
    return roleMap[role] || role;
}

// Kullanıcı ve seçili site bilgisi localStorage'dan
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));
const siteId = selectedSite?.site_id;

// -----------------------------------------
// API Request Helper
// -----------------------------------------
async function apiRequest(endpoint, data = null, method = 'GET') {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    console.log('🔵 API Request:', { method, endpoint, data, hasToken: !!token });

    try {
        const options = { method, headers };
        if (data && method !== 'GET') options.body = JSON.stringify(data);

        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const result = await response.json();

        console.log('🔵 API Response:', { status: response.status, ok: response.ok, result });

        return { ok: response.ok, data: result };
    } catch (error) {
        console.error('❌ API Hatası:', error);
        return { ok: false, data: { message: 'Bağlantı hatası: ' + error.message } };
    }
}


// -----------------------------------------
// DOMContentLoaded: dashboard başlığı, logout, veri yükleme
// -----------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    if (!currentUser || !selectedSite) {
        window.location.href = 'index.html';
        return;
    }

    // Dashboard başlığı
    const dashboardTitle = document.getElementById('dashboard-title');
    if (dashboardTitle && selectedSite?.site_name) {
        dashboardTitle.textContent = `Duyurular - ${selectedSite.site_name}`;
    }

    // Admin bilgisi (sağ üst)
    const userInfo = document.getElementById('dashboard-user-info');
    if (userInfo) {
        userInfo.innerHTML = `
            <div class="user-avatar" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #2196F3; color: white; border-radius: 50%; font-weight: bold;">${(currentUser.full_name || 'A')[0].toUpperCase()}</div>
            <div style="margin-left: 10px;">
                <div style="font-weight: 600;">${currentUser.full_name}</div>
                <div style="font-size: 12px; opacity: 0.8;">${getRoleText(currentUser.account_type)}</div>
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

    // Bugünden önceki tarihleri disable et (bugün dahil kabul et)
    const today = new Date().toISOString().split('T')[0];
    const announcementExpiry = document.getElementById('announcementExpiry');
    if (announcementExpiry) {
        announcementExpiry.setAttribute('min', today);
    }
});
async function setupAnnouncements() {
    if (!siteId) return;
    await loadAndRenderAnnouncements(siteId);
}

async function loadAndRenderAnnouncements(siteId) {
    try {
        const response = await fetchAnnouncements(siteId);

        console.log('📢 API Response:', response);

        if (!response.ok) {
            console.error('Duyurular yüklenemedi:', response.data.message);
            return;
        }

        // Response formatı: { success: true, data: { active, past, all } }
        const data = response.data.data || response.data;
        console.log('📢 Parsed data:', data);

        const active = data.active || [];
        const past = data.past || [];

        console.log('📢 Active announcements:', active);
        console.log('📢 Past announcements:', past);

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
        const isEdited = a.created_at !== a.updated_at;

        return `
        <div class="announcement-item" style="border-left:6px solid ${color};padding:20px;margin-bottom:20px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:all 0.3s ease;">
            <div style="display:flex;justify-content:space-between;align-items:start;gap:20px;">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <h3 style="margin:0;color:#2c3e50;font-size:18px;">${a.title}</h3>
                        ${isEdited ? `<span style="font-size:11px;padding:4px 10px;background:#e67e22;color:white;border-radius:20px;font-weight:600;">✏️ DÜZENLENDİ</span>` : ''}
                    </div>
                    <p style="margin:0 0 12px 0;color:#555;line-height:1.6;font-size:15px;">${a.content}</p>
                    <div style="font-size:13px;color:#7f8c8d;display:flex;gap:15px;">
                        <span><strong>📅 Yayın:</strong> ${new Date(a.start_date).toLocaleDateString('tr-TR')}</span>
                        <span><strong>⏰ Bitiş:</strong> ${new Date(a.end_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
                <div style="display:flex;gap:10px;flex-direction:column;min-width:110px;">
                    <button class="btn-edit" onclick="openEditModal(${a.id}, '${escapeHtml(a.title)}', '${escapeHtml(a.content)}', '${a.start_date}', '${a.end_date}', '${a.priority}')" style="padding:10px 16px;background:#3498db;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px;transition:background 0.3s;display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span>✏️</span> Düzenle
                    </button>
                    <button class="btn-delete" onclick="deleteAnnouncementHandler(${a.id})" style="padding:10px 16px;background:#e74c3c;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px;transition:background 0.3s;display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span>🗑️</span> Sil
                    </button>
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
        <div class="announcement-item" style="border-left:6px solid #95a5a6;padding:20px;margin-bottom:20px;background:#f8f9fa;border-radius:8px;opacity:0.9;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div style="display:flex;justify-content:space-between;align-items:start;gap:20px;">
                <div style="flex:1;">
                    <h3 style="margin:0 0 12px 0;color:#2c3e50;font-size:18px;">${a.title}</h3>
                    <p style="margin:0 0 12px 0;color:#555;line-height:1.6;font-size:15px;">${a.content}</p>
                    <div style="font-size:13px;color:#7f8c8d;display:flex;gap:15px;">
                        <span><strong>📅 Yayın:</strong> ${new Date(a.start_date).toLocaleDateString('tr-TR')}</span>
                        <span><strong>⏰ Bitiş:</strong> ${new Date(a.end_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
                <button class="btn-delete" onclick="deleteAnnouncementHandler(${a.id})" style="padding:10px 16px;background:#e74c3c;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px;transition:background 0.3s;display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;">
                    <span>🗑️</span> Sil
                </button>
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

        if (!title || !content || !startDate || !endDate) {
            alert('Tüm alanları doldurun!');
            return;
        }

        // Tarih karşılaştırması (sadece gün kısmına göre)
        if (startDate > endDate) {
            alert('Başlangıç tarihi bitiş tarihinden önce olmalıdır!');
            return;
        }

        const data = { title, content, start_date: startDate, end_date: endDate, priority: 'normal' };

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

    // Min date'i bugünün tarihine ayarla
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('editAnnouncementDate').min = today;
    document.getElementById('editAnnouncementExpiry').min = today;

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

        if (!title || !content) {
            alert('Başlık ve içerik boş olamaz!');
            return;
        }

        if (!startDate || !endDate) {
            alert('Lütfen başlangıç ve bitiş tarihlerini girin!');
            return;
        }

        if (startDate > endDate) {
            alert('Başlangıç tarihi bitiş tarihinden önce olmalıdır!');
            return;
        }

        const data = { title, content, start_date: startDate, end_date: endDate, priority: 'normal' };
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