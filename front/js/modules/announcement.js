// js/modules/announcement.js

// Eski import silindi. Artık apiCall kullanıyoruz.
import { apiCall } from './api.js'; 

const API_BASE = '/sites'; // apiCall zaten /api'yi ekliyor

// Bu fonksiyon siteId ile tüm duyuruları çeker
async function fetchAnnouncements(siteId) {
    try {
        // TEST: Token kontrolü kaldırıldı (false)
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

// Yeni duyuru ekleme (Yönetici)
async function createAnnouncement(siteId, announcementData) {
    try {
        // TEST: Token kontrolü kaldırıldı (false)
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

// Duyuru güncelleme (Yönetici)
async function updateAnnouncement(siteId, announcementId, announcementData) {
    try {
        // TEST: Token kontrolü kaldırıldı (false)
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

// Duyuru silme (Yönetici)
async function deleteAnnouncement(siteId, announcementId) {
    try {
        // TEST: Token kontrolü kaldırıldı (false)
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

// DOM ile ilişkilendirme ve event listener ekleme
function setupAnnouncements() {
    // GEÇICI: Eski siteId'yi temizle (ilk kullanımda bir kez çalışır)
    sessionStorage.removeItem('siteId');
    
    // Test için sabit siteId kullan (gerçek uygulamada sessionStorage'dan gelecek)
    let siteId = sessionStorage.getItem('siteId');
    
    if (!siteId) {
        console.warn('Site ID bulunamadı! Test için demo siteId kullanılıyor.');
        // Demo siteId - veritabanında oluşturduğumuz demo site
        siteId = 'DEMO-SITE-001'; 
        sessionStorage.setItem('siteId', siteId);
        console.log('✅ Demo Site ID ayarlandı:', siteId);
    } else {
        console.log('✅ Site ID bulundu:', siteId);
    }

    console.log('Duyurular modülü başlatılıyor. Site ID:', siteId);

    // Duyuruları yükle
    loadAndRenderAnnouncements(siteId);

    // Form submit event'i
    const announcementForm = document.getElementById('announcementForm');
    if (announcementForm) {
        announcementForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('announcementTitle').value;
            const content = document.getElementById('announcementContent').value;
            const startDate = document.getElementById('announcementDate').value;
            const endDate = document.getElementById('announcementExpiry').value;
            const priority = document.getElementById('announcementPriority').value;

            try {
                const announcementData = {
                    title: title,
                    content: content,
                    start_date: new Date(startDate).toISOString(),
                    end_date: new Date(endDate).toISOString(),
                    priority: priority
                };

                console.log('Duyuru gönderiliyor:', announcementData);

                const result = await createAnnouncement(siteId, announcementData);
                
                console.log('Duyuru oluşturuldu:', result);
                alert('Duyuru başarıyla yayınlandı!');
                
                // Formu temizle
                announcementForm.reset();
                
                // Duyuruları yeniden yükle
                loadAndRenderAnnouncements(siteId);
            } catch (error) {
                console.error('Duyuru oluşturma hatası:', error);
                alert('Duyuru oluşturulamadı: ' + error.message);
            }
        });
    }
}

// Duyuruları yükle ve render et
async function loadAndRenderAnnouncements(siteId) {
    try {
        console.log('Duyurular yükleniyor...');
        const response = await fetchAnnouncements(siteId);
        
        console.log('API yanıtı:', response);
        
        // API yanıtından duyuruları al
        const announcements = response.announcements || response;
        
        if (!announcements) {
            console.error('Duyurular alınamadı');
            return;
        }

        // Aktif ve geçmiş duyuruları ayır
        const active = announcements.active || [];
        const past = announcements.past || [];

        console.log('Aktif duyurular:', active);
        console.log('Geçmiş duyurular:', past);

        // Render fonksiyonlarını çağır
        renderActiveAnnouncements(active, siteId);
        renderPastAnnouncements(past, siteId);
    } catch (error) {
        console.error('Duyurular yüklenirken hata:', error);
    }
}

// Aktif duyuruları render et
function renderActiveAnnouncements(announcements, siteId) {
    const container = document.getElementById('current-announcements-list');
    if (!container) return;

    if (announcements.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Aktif duyuru bulunmamaktadır.</p>';
        return;
    }

    container.innerHTML = announcements.map(announcement => `
        <div class="announcement-item" style="border-left: 4px solid #3498db; padding: 15px; margin-bottom: 15px; background: #f8f9fa; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 10px 0; color: #2c3e50;">${announcement.title}</h4>
                    <p style="margin: 0 0 10px 0; color: #7f8c8d;">${announcement.content}</p>
                    <div style="font-size: 12px; color: #95a5a6;">
                        <span><strong>Başlangıç:</strong> ${new Date(announcement.start_date).toLocaleDateString('tr-TR')}</span> | 
                        <span><strong>Bitiş:</strong> ${new Date(announcement.end_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-edit" onclick="editAnnouncement('${siteId}', ${announcement.id})" style="padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer;">Düzenle</button>
                    <button class="btn-delete" onclick="deleteAnnouncementHandler('${siteId}', ${announcement.id})" style="padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer;">Sil</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Geçmiş duyuruları render et
function renderPastAnnouncements(announcements, siteId) {
    const container = document.getElementById('past-announcements-list');
    if (!container) return;

    if (announcements.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Geçmiş duyuru bulunmamaktadır.</p>';
        return;
    }

    container.innerHTML = announcements.map(announcement => `
        <div class="announcement-item" style="border-left: 4px solid #95a5a6; padding: 15px; margin-bottom: 15px; background: #ecf0f1; border-radius: 4px; opacity: 0.8;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 10px 0; color: #2c3e50;">${announcement.title}</h4>
                    <p style="margin: 0 0 10px 0; color: #7f8c8d;">${announcement.content}</p>
                    <div style="font-size: 12px; color: #95a5a6;">
                        <span><strong>Başlangıç:</strong> ${new Date(announcement.start_date).toLocaleDateString('tr-TR')}</span> | 
                        <span><strong>Bitiş:</strong> ${new Date(announcement.end_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
                <div>
                    <button class="btn-delete" onclick="deleteAnnouncementHandler('${siteId}', ${announcement.id})" style="padding: 5px 10px; background: #95a5a6; color: white; border: none; border-radius: 3px; cursor: pointer;">Sil</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Global fonksiyonlar (inline onclick için)
window.deleteAnnouncementHandler = async function(siteId, announcementId) {
    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) {
        return;
    }

    try {
        await deleteAnnouncement(siteId, announcementId);
        alert('Duyuru silindi!');
        loadAndRenderAnnouncements(siteId);
    } catch (error) {
        console.error('Silme hatası:', error);
        alert('Duyuru silinemedi: ' + error.message);
    }
};

window.editAnnouncement = async function(siteId, announcementId) {
    try {
        // Duyuruyu API'den al
        const response = await apiCall(`${API_BASE}/${siteId}/announcements/${announcementId}`, 'GET', null, false);
        
        if (!response.ok) {
            throw new Error('Duyuru bilgisi alınamadı');
        }
        
        const data = await response.json();
        const announcement = data.announcement || data;
        
        console.log('Düzenlenecek duyuru:', announcement);
        
        // Modal'ı doldur
        document.getElementById('editAnnouncementId').value = announcement.id;
        document.getElementById('editAnnouncementTitle').value = announcement.title;
        document.getElementById('editAnnouncementContent').value = announcement.content;
        
        // Tarihleri düzenle (ISO formatından date input formatına)
        const startDate = new Date(announcement.start_date).toISOString().split('T')[0];
        const endDate = new Date(announcement.end_date).toISOString().split('T')[0];
        
        document.getElementById('editAnnouncementDate').value = startDate;
        document.getElementById('editAnnouncementExpiry').value = endDate;
        document.getElementById('editAnnouncementPriority').value = announcement.priority || 'normal';
        
        // Modal'ı göster
        const modal = document.getElementById('editModal');
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Düzenleme hatası:', error);
        alert('Duyuru düzenlenemedi: ' + error.message);
    }
};

// Modal'ı kapat
window.closeEditModal = function() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editAnnouncementForm').reset();
};

// Düzenleme formu submit
document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('editAnnouncementForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const siteId = sessionStorage.getItem('siteId') || 'BACON124';
            const announcementId = document.getElementById('editAnnouncementId').value;
            
            const updateData = {
                title: document.getElementById('editAnnouncementTitle').value,
                content: document.getElementById('editAnnouncementContent').value,
                start_date: new Date(document.getElementById('editAnnouncementDate').value).toISOString(),
                end_date: new Date(document.getElementById('editAnnouncementExpiry').value).toISOString(),
                priority: document.getElementById('editAnnouncementPriority').value
            };
            
            try {
                console.log('Güncelleme gönderiliyor:', updateData);
                
                await updateAnnouncement(siteId, announcementId, updateData);
                
                alert('Duyuru başarıyla güncellendi!');
                closeEditModal();
                loadAndRenderAnnouncements(siteId);
                
            } catch (error) {
                console.error('Güncelleme hatası:', error);
                alert('Duyuru güncellenemedi: ' + error.message);
            }
        });
    }
});

export { setupAnnouncements, fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };