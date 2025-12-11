
const API_BASE_URL = 'http://localhost:3000/api';
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));
const getCurrentSiteId = () => selectedSite?.site_id || '1';
const getToken = () => localStorage.getItem('authToken'); 

// =================================================================
// UI Helper: Duyuru Item'ını Oluşturma
// =================================================================
function createAnnouncementItem(announcement, isPast) {
    const today = new Date().toISOString().split('T')[0];
    // Backend'den gelen expiryDate'i kontrol ediyoruz
    const isExpired = announcement.expiryDate && announcement.expiryDate < today; 
    
    // Öncelik sınıfı ve metni
    const priority = announcement.priority ? announcement.priority.toLowerCase() : 'normal';
    const priorityLabel = announcement.priority_label || 
                          (priority === 'urgent' ? 'Acil' : priority === 'important' ? 'Önemli' : 'Normal');

    // Item sınıfını belirle
    const itemClass = isPast || isExpired ? 'announcement-item expired' : `announcement-item ${priority}`;
    
    // Yönetici aksiyon butonları (Yönetici yetkisi kontrolünü backend veya başka bir yerden almalısınız)
    const actionButtons = `
        <div class="announcement-actions">
            ${!isExpired ? `<button class="btn btn-small btn-warning edit-btn" data-id="${announcement.id}"><i class="fas fa-edit"></i> Düzenle</button>` : ''}
            <button class="btn btn-small btn-danger delete-btn" data-id="${announcement.id}"><i class="fas fa-trash-alt"></i> Sil</button>
        </div>
    `;

    return `
        <div class="${itemClass}" data-id="${announcement.id}" 
             style="border-left: 5px solid; padding: 15px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div class="announcement-header">
                <div style="flex-grow: 1;">
                    <div class="announcement-title">${announcement.title}</div>
                </div>
                ${!isPast ? actionButtons : ''}
            </div>
            <div class="announcement-content">${announcement.content}</div>
            <div class="announcement-meta">
                <span class="announcement-date">Yayın: ${announcement.publishDate || 'Tarih Yok'}</span>
                <span class="announcement-date">S. Geçerlilik: ${announcement.expiryDate || 'Süresiz'}</span>
                <span class="status ${priority}">${priorityLabel}</span>
            </div>
        </div>
    `;
}

// =================================================================
// C - CREATE (Yeni Duyuru Yayınla) - POST /api/sites/{siteId}/announcements
// =================================================================
async function handleNewAnnouncement(event) {
    event.preventDefault();
    const siteId = getCurrentSiteId();
    if (!siteId) return alert('Lütfen site ID bilgisini kontrol edin.');

    // Form verilerini al
    const announcementData = {
        title: document.getElementById('announcementTitle').value,
        content: document.getElementById('announcementContent').value,
        publishDate: document.getElementById('announcementDate').value,
        expiryDate: document.getElementById('announcementExpiry').value,
        priority: document.getElementById('announcementPriority').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/announcements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(announcementData)
        });

        if (response.ok) {
            alert('Duyuru başarıyla yayınlandı!');
            document.getElementById('announcementForm').reset();
            loadAnnouncements(); 
        } else {
            const error = await response.json();
            alert(`Duyuru yayınlanırken hata oluştu: ${error.message || response.statusText}`);
        }
    } catch (error) {
        console.error('Duyuru yayınlama hatası:', error);
        alert('Sunucuya bağlanılamadı.');
    }
}

// =================================================================
// R - READ (Duyuruları Çek ve Filtrele) - GET /api/sites/{siteId}/announcements
// =================================================================
async function loadAnnouncements() {
    const siteId = getCurrentSiteId();
    const activeListEl = document.getElementById('current-announcements-list');
    const pastListEl = document.getElementById('past-announcements-list');
    
    if (!siteId) {
        activeListEl.innerHTML = '<p style="text-align: center; color: #e74c3c;">Lütfen site seçimi yapın.</p>';
        pastListEl.innerHTML = '';
        return;
    }

    activeListEl.innerHTML = '<p style="text-align: center; color: #7f8c8d;"><i class="fas fa-spinner fa-spin"></i> Yükleniyor...</p>';
    pastListEl.innerHTML = '';

    try {
        // API'den tüm duyuruları çek
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/announcements`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (response.ok) {
            const announcements = await response.json();
            const today = new Date().toISOString().split('T')[0];

            let activeHtml = '';
            let pastHtml = '';
            
            // Duyuruları geçerlilik tarihine göre Active ve Past olarak ayır
            announcements.forEach(announcement => {
                const isPast = announcement.expiryDate && announcement.expiryDate < today;
                if (isPast) {
                    pastHtml += createAnnouncementItem(announcement, true);
                } else {
                    activeHtml += createAnnouncementItem(announcement, false);
                }
            });

            // Listeleri doldur
            activeListEl.innerHTML = activeHtml || '<p style="text-align: center; color: #7f8c8d;">Aktif duyuru bulunmamaktadır.</p>';
            pastListEl.innerHTML = pastHtml || '<p style="text-align: center; color: #7f8c8d;">Geçmiş duyuru bulunmamaktadır.</p>';

        } else {
            activeListEl.innerHTML = `<p style="text-align: center; color: #e74c3c;">Duyurular yüklenemedi: ${response.statusText}</p>`;
        }
    } catch (error) {
        console.error('Duyuruları çekme hatası:', error);
        activeListEl.innerHTML = `<p style="text-align: center; color: #e74c3c;">Sunucu hatası: Bağlantı kurulamadı.</p>`;
    }
}

// =================================================================
// D - DELETE (Duyuru Sil) - DELETE /api/sites/{siteId}/announcements/{announcementId}
// =================================================================
async function deleteAnnouncement(announcementId) {
    const siteId = getCurrentSiteId();
    if (!siteId || !announcementId) return;

    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/announcements/${announcementId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (response.ok) {
            alert('Duyuru başarıyla silindi.');
            loadAnnouncements(); 
        } else {
            const error = await response.json();
            alert(`Silme işlemi başarısız: ${error.message || response.statusText}`);
        }
    } catch (error) {
        console.error('Duyuru silme hatası:', error);
        alert('Sunucuya bağlanırken bir hata oluştu.');
    }
}

// =================================================================
// Aksiyonları Yönlendirici (Silme ve Düzenleme)
// =================================================================
function handleAnnouncementActions(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const announcementId = target.dataset.id;

    if (target.classList.contains('delete-btn')) {
        deleteAnnouncement(announcementId);
    } else if (target.classList.contains('edit-btn')) {
        // Düzenleme (PUT) için bir modal açma ve formu doldurma mantığı buraya eklenecek.
        // Şimdilik sadece uyarı verelim.
        alert(`Duyuru ID ${announcementId} için Düzenle butonuna tıklandı. (PUT /api/sites/{siteId}/announcements/${announcementId})`);
    }
}

// =================================================================
// MODÜL BAŞLANGIÇ FONKSİYONU
// =================================================================
export function setupAnnouncements() {
    // 1. Yeni Duyuru Ekleme Formunu Dinle
    const form = document.getElementById('announcementForm');
    if (form) {
        form.addEventListener('submit', handleNewAnnouncement);
    }
    
    // 2. Aktif ve Geçmiş Duyurular Listesindeki Butonları Dinle
    document.getElementById('current-announcements-list')?.addEventListener('click', handleAnnouncementActions);
    document.getElementById('past-announcements-list')?.addEventListener('click', handleAnnouncementActions);

    // 3. Duyuruları Yükle
    loadAnnouncements();
    
    console.log('Duyuru Yönetimi Modülü başlatıldı.');
}