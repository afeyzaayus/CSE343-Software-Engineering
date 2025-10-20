// js/modules/announcement.js

// Eski import silindi. Artık apiCall kullanıyoruz.
import { apiCall } from './api.js'; 

const API_BASE = '/sites'; // apiCall zaten /api'yi ekliyor

// Bu fonksiyon siteId ile tüm duyuruları çeker
async function fetchAnnouncements(siteId) {
    try {
        // needsAuth: true olarak işaretlendi. Token'ı apiCall otomatik ekleyecek.
        const res = await apiCall(`${API_BASE}/${siteId}/announcements`, 'GET', null, true); 
        
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
        const res = await apiCall(`${API_BASE}/${siteId}/announcements`, 'POST', announcementData, true);

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
        const res = await apiCall(`${API_BASE}/${siteId}/announcements/${announcementId}`, 'PUT', announcementData, true);

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
        const res = await apiCall(`${API_BASE}/${siteId}/announcements/${announcementId}`, 'DELETE', null, true);

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

// DOM ile ilişkilendirme ve event listener ekleme (Bu kısım aynı kaldı)
function setupAnnouncements() {
    const siteId = sessionStorage.getItem('siteId');
    if (!siteId) {
        console.error('Site ID bulunamadı!');
        return;
    }
    // ... (Kalan DOM kodları) ...
}

export { setupAnnouncements, fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };