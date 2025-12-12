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
    const statsUrl = `/dashboard/statistics/${currentSiteId}`; 
    const announcementUrl = `/dashboard/announcements/${currentSiteId}?limit=3`; 
    
    try {
        // 1. İstatistikleri Çekme (Dashboard Kartları)
        const statsResponse = await apiCall(statsUrl, 'GET', null, true);
        
        // 2. Duyuru Özetini Çekme
        const announcementResponse = await apiCall(announcementUrl, 'GET', null, true);

        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('Stats Data:', statsData); // Debug
            
            // Backend'den gelen data objesi içindeki veriyi al
            if (statsData.success && statsData.data) {
                renderStatCards(statsData.data);
            } else {
                console.error("İstatistik verisi formatı hatalı:", statsData);
            }
        } else {
            console.error("İstatistikler yüklenemedi:", await statsResponse.json());
        }
        
        if (announcementResponse.ok) {
            const announcementData = await announcementResponse.json();
            console.log('Announcement Data:', announcementData); // Debug
            
            // Backend'in duyuruları 'data' içinde döndürdüğü için onu al
            if (announcementData.success && announcementData.data) {
                renderAnnouncementSummary(announcementData.data);
            } else if (Array.isArray(announcementData)) {
                renderAnnouncementSummary(announcementData);
            } else {
                console.error("Duyuru verisi formatı hatalı:", announcementData);
            }
        } else {
            console.error("Duyuru özeti yüklenemedi:", await announcementResponse.json());
        }

    } catch (error) {
        console.error("Dashboard veri çekme hatası:", error);
    }
}

function renderStatCards(stats) {
    console.log('Stats:', stats); // Debug için
    
    // Daire Doluluk Kartı
    const occCard = document.getElementById('occupancy-card');
    if (occCard && stats.statistics && stats.statistics.occupancy) {
        const occ = stats.statistics.occupancy;
        occCard.querySelector('.card-value').textContent = `${occ.percentage || 0}%`;
        occCard.querySelector('.card-footer').textContent = `${occ.occupied || 0}/${occ.total || 0} dolu`;
    }
    
    // Aidat Ödenme Kartı
    const duesCard = document.getElementById('dues-card');
    if (duesCard && stats.statistics && stats.statistics.dues) {
        const dues = stats.statistics.dues;
        duesCard.querySelector('.card-value').textContent = `${dues.percentage || 0}%`;
        duesCard.querySelector('.card-footer').textContent = `${dues.paid_count || 0}/${dues.total_count || 0} ödendi`;
    }

    // Aktif Duyurular Kartı
    const annCard = document.getElementById('announcement-card');
    if (annCard && stats.statistics && stats.statistics.announcements) {
        annCard.querySelector('.card-value').textContent = stats.statistics.announcements.active || 0;
        annCard.querySelector('.card-footer').textContent = `Toplam: ${stats.statistics.announcements.total || 0}`;
    }
    
    // Bekleyen Şikayet/Talepler Kartı
    const reqCard = document.getElementById('requests-card');
    if (reqCard && stats.statistics && stats.statistics.requests) {
        reqCard.querySelector('.card-value').textContent = stats.statistics.requests.pending || 0;
        reqCard.querySelector('.card-footer').textContent = `Toplam: ${stats.statistics.requests.total || 0}`;
    }
}

function renderAnnouncementSummary(announcements) {
    const container = document.getElementById('current-announcements'); 
    if (!container) return;

    container.innerHTML = '';

    if (!announcements || announcements.length === 0) {
        container.innerHTML = `<p style="text-align: center; padding: 15px; color: #7f8c8d;">Aktif duyuru bulunmamaktadır.</p>`;
        return;
    }

    announcements.forEach(item => {
        const contentPreview = item.content ? item.content.substring(0, 80) + (item.content.length > 80 ? '...' : '') : 'Detay yok.';
        const startDate = item.start_date ? new Date(item.start_date).toLocaleDateString('tr-TR') : 'Tarih Yok';
        const endDate = item.end_date ? new Date(item.end_date).toLocaleDateString('tr-TR') : 'Belirtilmemiş';
        const status = item.status || 'Normal';
        
        const itemHTML = `
            <div class="announcement-item">
                <div class="announcement-title">${item.title || 'Başlıksız Duyuru'} <span class="status-badge status-${status.toLowerCase()}">${status}</span></div>
                <div class="announcement-content">${contentPreview}</div>
                <div class="announcement-meta">
                    <span class="announcement-date">Başlangıç: ${startDate}</span>
                    <span class="announcement-expiry">Bitiş: ${endDate}</span>
                </div>
            </div>
        `;
        container.innerHTML += itemHTML;
    });
}

// --- Modül Başlatma Fonksiyonu ---
export function setupDashboard() {
    // Kullanıcı bilgilerini göster
    setupUserInfo();
    
    // Logout işlemini ayarla
    setupLogout();
    
    // Dashboard verilerini yükle
    loadDashboardData(); 
}

// --- Kullanıcı Bilgilerini Göster ---
function setupUserInfo() {
    const currentUser = JSON.parse(sessionStorage.getItem('adminData') || '{}');
    const selectedSite = JSON.parse(sessionStorage.getItem('selectedSite') || '{}');
    
    // Dashboard başlığını güncelle
    const dashboardTitle = document.getElementById('dashboard-title');
    if (dashboardTitle && selectedSite.site_name) {
        dashboardTitle.textContent = `Ana Sayfa - ${selectedSite.site_name}`;
    }
    
    // Kullanıcı bilgilerini göster
    const userInfo = document.getElementById('dashboard-user-info');
    if (userInfo && currentUser.full_name) {
        const initial = currentUser.full_name.charAt(0).toUpperCase();
        const accountType = currentUser.account_type === 'SITE_MANAGER' ? 'Site Yöneticisi' : 
                          currentUser.account_type === 'COMPANY_ADMIN' ? 'Şirket Yöneticisi' : 
                          'Yönetici';
        
        userInfo.innerHTML = `
            <div class="user-avatar">${initial}</div>
            <div style="margin-left: 10px;">
                <div style="font-weight: 600;">${currentUser.full_name}</div>
                <div style="font-size: 12px; opacity: 0.8;">${accountType}</div>
            </div>
        `;
    }
}

// --- Logout İşlemi ---
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = '/login.html';
        });
    }
}