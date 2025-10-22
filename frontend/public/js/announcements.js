const BASE_URL = 'http://localhost:3000/api';
const AUTH_BASE_URL = 'http://localhost:3000/api/auth';

let currentUser = null;
let currentToken = null;
let currentSiteId = null;
let userRole = null; // 'admin' veya 'user'

// Sayfa yüklendiğinde kullanıcı bilgilerini kontrol et
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Kimlik doğrulama kontrolü
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const role = localStorage.getItem('role');

    // Test için: Eğer localStorage boşsa, demo kullanıcı oluştur
    if (!token || !user) {
        // Demo/Test modu - Gerçek üretimde bu kısmı kaldırın
        console.warn('Auth bilgisi bulunamadı. Demo mod aktif.');
        
        // Demo admin kullanıcısı
        currentUser = {
            id: 1,
            full_name: 'Test Admin',
            email: 'test@admin.com',
            account_type: 'INDIVIDUAL'
        };
        currentToken = 'demo-token';
        userRole = 'admin';
        
        // LocalStorage'a kaydet
        localStorage.setItem('token', currentToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        localStorage.setItem('role', userRole);
        
        updateUserInfo();
        loadUserSites();
        return;
    }

    currentToken = token;
    currentUser = JSON.parse(user);
    userRole = role;

    updateUserInfo();
    loadUserSites();
}

// Kullanıcı bilgilerini güncelle
function updateUserInfo() {
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    const userRoleElement = document.getElementById('user-role');

    if (userName) userName.textContent = currentUser.full_name || 'Kullanıcı';
    if (userAvatar) userAvatar.textContent = (currentUser.full_name || 'U').charAt(0).toUpperCase();
    if (userRoleElement) userRoleElement.textContent = userRole === 'admin' ? 'Yönetici' : 'Kullanıcı';

    // Admin ise form bölümünü göster
    if (userRole === 'admin') {
        document.getElementById('admin-section').classList.remove('hidden');
    }
}

// Kullanıcının sitelerini yükle
async function loadUserSites() {
    try {
        const response = await fetch(`${AUTH_BASE_URL}/site/admin-sites`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const sites = data.sites || [];
            populateSiteSelector(sites);
        } else {
            // Kullanıcı için site bilgisini localStorage'dan al
            if (currentUser.siteId) {
                // Site bilgisini almak için ayrı bir endpoint kullanılabilir
                // Şimdilik sadece mevcut site id'yi kullan
                currentSiteId = currentUser.siteId;
                loadAnnouncements();
            }
        }
    } catch (error) {
        console.error('Site yükleme hatası:', error);
        showAlert('announcement-alert', 'Siteler yüklenemedi.', true);
    }
}

// Site seçim dropdown'unu doldur
function populateSiteSelector(sites) {
    const siteSelector = document.getElementById('selected-site');
    siteSelector.innerHTML = '<option value="">Lütfen bir site seçin</option>';

    sites.forEach(site => {
        const option = document.createElement('option');
        option.value = site.site_id;
        option.textContent = site.site_name;
        siteSelector.appendChild(option);
    });

    // İlk site'yi otomatik seç
    if (sites.length > 0) {
        siteSelector.value = sites[0].site_id;
        currentSiteId = sites[0].site_id;
        loadAnnouncements();
    }
}

// Duyuruları yükle
async function loadAnnouncements() {
    const siteSelect = document.getElementById('selected-site');
    currentSiteId = siteSelect.value;

    if (!currentSiteId) {
        showAlert('announcement-alert', 'Lütfen bir site seçin.', true);
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/sites/${currentSiteId}/announcements`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayAnnouncements(data.announcements);
        } else {
            const errorData = await response.json();
            showAlert('announcement-alert', errorData.message || 'Duyurular yüklenemedi.', true);
        }
    } catch (error) {
        console.error('Duyuru yükleme hatası:', error);
        showAlert('announcement-alert', 'Bağlantı hatası oluştu.', true);
    }
}

// Duyuruları ekranda göster
function displayAnnouncements(announcements) {
    const activeContainer = document.getElementById('active-announcements');
    const pastContainer = document.getElementById('past-announcements');

    const active = announcements.active || [];
    const past = announcements.past || [];

    // Aktif duyurular
    if (active.length === 0) {
        activeContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <h3>Henüz Aktif Duyuru Yok</h3>
                <p>Aktif duyurular burada görünecektir.</p>
            </div>
        `;
    } else {
        activeContainer.innerHTML = active.map(announcement => createAnnouncementCard(announcement, false)).join('');
    }

    // Geçmiş duyurular
    if (past.length === 0) {
        pastContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <h3>Henüz Geçmiş Duyuru Yok</h3>
                <p>Süresi dolmuş duyurular burada görünecektir.</p>
            </div>
        `;
    } else {
        pastContainer.innerHTML = past.map(announcement => createAnnouncementCard(announcement, true)).join('');
    }
}

// Duyuru kartı oluştur
function createAnnouncementCard(announcement, isPast) {
    const startDate = new Date(announcement.start_date).toLocaleString('tr-TR');
    const endDate = new Date(announcement.end_date).toLocaleString('tr-TR');
    
    const adminActions = userRole === 'admin' ? `
        <div class="announcement-actions">
            <button class="btn-small btn-edit" onclick="openEditModal(${announcement.id})">Düzenle</button>
            <button class="btn-small btn-delete" onclick="deleteAnnouncement(${announcement.id})">Sil</button>
        </div>
    ` : '';

    return `
        <div class="announcement-card ${isPast ? 'past' : ''}">
            <div class="announcement-header">
                <h4 class="announcement-title">${escapeHtml(announcement.title)}</h4>
                ${adminActions}
            </div>
            <div class="announcement-content">${escapeHtml(announcement.content)}</div>
            <div class="announcement-dates">
                <span><strong>Başlangıç:</strong> ${startDate}</span>
                <span><strong>Bitiş:</strong> ${endDate}</span>
            </div>
        </div>
    `;
}

// HTML karakterlerini escape et
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Yeni duyuru oluştur
document.getElementById('announcement-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentSiteId) {
        showAlert('announcement-alert', 'Lütfen bir site seçin.', true);
        return;
    }

    const title = document.getElementById('announcement-title').value;
    const content = document.getElementById('announcement-content').value;
    const start_date = document.getElementById('announcement-start-date').value;
    const end_date = document.getElementById('announcement-end-date').value;

    try {
        const response = await fetch(`${BASE_URL}/sites/${currentSiteId}/announcements`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content, start_date, end_date })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('announcement-alert', 'Duyuru başarıyla oluşturuldu!', false);
            e.target.reset();
            loadAnnouncements();
        } else {
            showAlert('announcement-alert', data.message || 'Duyuru oluşturulamadı.', true);
        }
    } catch (error) {
        console.error('Duyuru oluşturma hatası:', error);
        showAlert('announcement-alert', 'Bağlantı hatası oluştu.', true);
    }
});

// Düzenleme modalını aç
async function openEditModal(announcementId) {
    try {
        const response = await fetch(`${BASE_URL}/sites/${currentSiteId}/announcements/${announcementId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const announcement = data.announcement;

            document.getElementById('edit-announcement-id').value = announcement.id;
            document.getElementById('edit-announcement-title').value = announcement.title;
            document.getElementById('edit-announcement-content').value = announcement.content;
            
            // Tarihleri datetime-local formatına çevir
            const startDate = new Date(announcement.start_date).toISOString().slice(0, 16);
            const endDate = new Date(announcement.end_date).toISOString().slice(0, 16);
            
            document.getElementById('edit-announcement-start-date').value = startDate;
            document.getElementById('edit-announcement-end-date').value = endDate;

            document.getElementById('edit-modal').classList.remove('hidden');
        } else {
            const errorData = await response.json();
            showAlert('announcement-alert', errorData.message || 'Duyuru bilgisi alınamadı.', true);
        }
    } catch (error) {
        console.error('Duyuru getirme hatası:', error);
        showAlert('announcement-alert', 'Bağlantı hatası oluştu.', true);
    }
}

// Düzenleme modalını kapat
function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    document.getElementById('edit-announcement-form').reset();
}

// Duyuru güncelle
document.getElementById('edit-announcement-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const announcementId = document.getElementById('edit-announcement-id').value;
    const title = document.getElementById('edit-announcement-title').value;
    const content = document.getElementById('edit-announcement-content').value;
    const start_date = document.getElementById('edit-announcement-start-date').value;
    const end_date = document.getElementById('edit-announcement-end-date').value;

    try {
        const response = await fetch(`${BASE_URL}/sites/${currentSiteId}/announcements/${announcementId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content, start_date, end_date })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('edit-alert', 'Duyuru başarıyla güncellendi!', false);
            setTimeout(() => {
                closeEditModal();
                loadAnnouncements();
            }, 1500);
        } else {
            showAlert('edit-alert', data.message || 'Duyuru güncellenemedi.', true);
        }
    } catch (error) {
        console.error('Duyuru güncelleme hatası:', error);
        showAlert('edit-alert', 'Bağlantı hatası oluştu.', true);
    }
});

// Duyuru sil
async function deleteAnnouncement(announcementId) {
    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) {
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/sites/${currentSiteId}/announcements/${announcementId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('announcement-alert', 'Duyuru başarıyla silindi!', false);
            loadAnnouncements();
        } else {
            showAlert('announcement-alert', data.message || 'Duyuru silinemedi.', true);
        }
    } catch (error) {
        console.error('Duyuru silme hatası:', error);
        showAlert('announcement-alert', 'Bağlantı hatası oluştu.', true);
    }
}

// Alert göster
function showAlert(elementId, message, isError = false) {
    const alert = document.getElementById(elementId);
    if (!alert) return;

    alert.textContent = message;
    alert.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
    alert.classList.remove('hidden');
    
    setTimeout(() => {
        alert.classList.add('hidden');
    }, 5000);
}

// Çıkış yap
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    window.location.href = 'index.html';
}

// Geri dön
function goBack() {
    window.history.back();
}
