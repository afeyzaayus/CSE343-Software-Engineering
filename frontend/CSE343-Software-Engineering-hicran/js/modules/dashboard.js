// js/modules/dashboard.js (REVİZE EDİLMİŞ)

import { apiCall } from './api.js';

// --- Veri Çekme Fonksiyonu ---

async function loadDashboardData() {
    // Site ID'yi her seferinde sessionStorage'dan okumak en güvenilir yoldur.
    const currentSiteId = sessionStorage.getItem('siteId');

    if (!currentSiteId) {
        console.error("Site ID seçilmemiş. Dashboard yüklenemiyor.");
        // Gerekirse site seçim sayfasına yönlendirin.
        return; 
    }

    // Endpointleri site ID ile dinamik olarak oluştur
    const statsUrl = `/sites/${currentSiteId}/dashboard/stats`; 
    const announcementUrl = `/sites/${currentSiteId}/announcements?limit=2`; 
    
    try {
        // 1. İstatistikleri Çekme (Dashboard Kartları)
        const statsResponse = await apiCall(statsUrl, 'GET', null, true);
        
        // 2. Duyuru Özetini Çekme
        const announcementResponse = await apiCall(announcementUrl, 'GET', null, true);

        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            renderStatCards(stats);
        } else {
            console.error("İstatistikler yüklenemedi:", await statsResponse.json());
        }
        
        if (announcementResponse.ok) {
            // Backend'in duyuruları 'data' içinde döndürme ihtimaline karşı ek koruma
            const announcementsData = await announcementResponse.json();
            renderAnnouncementSummary(announcementsData.data || announcementsData); 
        } else {
            console.error("Duyuru özeti yüklenemedi:", await announcementResponse.json());
        }

    } catch (error) {
        console.error("Dashboard veri çekme hatası:", error);
    }
}

function renderStatCards(stats) {
    // Daire Doluluk Kartı
    const occCard = document.getElementById('occupancy-card');
    if (occCard && stats.occupancy) {
        occCard.querySelector('.card-value').textContent = `${stats.occupancy.percent || 0}%`;
        occCard.querySelector('.card-footer').textContent = `${stats.occupancy.count || 0}/${stats.occupancy.total || 0} dolu`;
    }
    
    // Aidat Ödenme Kartı
    const duesCard = document.getElementById('dues-card');
    if (duesCard && stats.dues) {
        duesCard.querySelector('.card-value').textContent = `${stats.dues.percent || 0}%`;
        duesCard.querySelector('.card-footer').textContent = `${stats.dues.paidCount || 0}/${stats.dues.totalCount || 0} ödendi`;
    }

    // Aktif Duyurular Kartı
    const annCard = document.getElementById('announcement-card');
    if (annCard && stats.activeAnnouncements !== undefined) {
        annCard.querySelector('.card-value').textContent = stats.activeAnnouncements;
    }
    
    // Bekleyen Şikayet/Talepler Kartı
    const reqCard = document.getElementById('requests-card');
    if (reqCard && stats.pendingRequests !== undefined) {
        reqCard.querySelector('.card-value').textContent = stats.pendingRequests;
    }
}

function renderAnnouncementSummary(announcements) {
    const container = document.getElementById('current-announcements'); 
    if (!container) return;

    container.innerHTML = '';

    if (announcements.length === 0) {
        container.innerHTML = `<p style="text-align: center; padding: 15px; color: #7f8c8d;">Aktif duyuru özeti bulunmamaktadır.</p>`;
        return;
    }

    announcements.forEach(item => {
        const contentPreview = item.content ? item.content.substring(0, 80) + (item.content.length > 80 ? '...' : '') : 'Detay yok.';
        const itemHTML = `
            <div class="announcement-item">
                <div class="announcement-title">${item.title || 'Başlıksız Duyuru'}</div>
                <div class="announcement-content">${contentPreview}</div>
                <div class="announcement-meta">
                    <span class="announcement-date">Yayın: ${item.publishDate ? new Date(item.publishDate).toLocaleDateString() : 'Tarih Yok'}</span>
                    <span class="announcement-expiry">Son: ${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'Belirtilmemiş'}</span>
                </div>
            </div>
        `;
        container.innerHTML += itemHTML;
    });
}

// --- Modül Başlatma Fonksiyonu ---
export function setupDashboard() {
    loadDashboardData(); 
}