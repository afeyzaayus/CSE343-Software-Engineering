// main.js - Dashboard için frontend JavaScript

// API Base URL (backend adresinizi buraya yazın)
const API_BASE_URL = 'http://localhost:3000/api';

// Site ID'sini localStorage'dan veya URL'den al
let currentSiteId = localStorage.getItem('currentSiteId') || 1 ;

/**
 * Sayfa yüklendiğinde çalışır
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Dashboard yükleniyor...');
  
  // Dashboard verilerini yükle
  await loadDashboard();
});

/**
 * Dashboard verilerini API'den çeker ve sayfaya yazar
 */
async function loadDashboard() {
  try {
    showLoading();
    
    // API'den dashboard verilerini al
    const response = await fetch(`${API_BASE_URL}/sites/${currentSiteId}/dashboard`);
    
    if (!response.ok) {
      throw new Error('Dashboard verileri alınamadı');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Bir hata oluştu');
    }
    
    const data = result.data;
    
    // Verileri sayfaya yerleştir
    updateSiteInfo(data.site_info);
    updateStatistics(data.statistics);
    updateRecentAnnouncements(data.recent_announcements);
    
    hideLoading();
    
  } catch (error) {
    console.error('Dashboard yükleme hatası:', error);
    showError('Dashboard verileri yüklenirken bir hata oluştu: ' + error.message);
  }
}

/**
 * Site bilgilerini günceller (Üst kısım)
 */
function updateSiteInfo(siteInfo) {
  // Sayfa başlığını güncelle
  const headerTitle = document.querySelector('.header h2');
  if (headerTitle) {
    headerTitle.textContent = `Ana Sayfa - ${siteInfo.site_name}`;
  }
  
  // Admin bilgisini güncelle
  const userInfo = document.querySelector('.user-info');
  if (userInfo) {
    userInfo.innerHTML = `
      <div class="user-avatar">${getInitials(siteInfo.admin_name)}</div>
      <span>${siteInfo.admin_name}</span>
    `;
  }
}

/**
 * İstatistik kartlarını günceller
 */
function updateStatistics(stats) {
  // 1. Daire Doluluk Oranı
  const occupancyCard = document.getElementById('occupancy-card');
  if (occupancyCard) {
    occupancyCard.querySelector('.card-value').textContent = `%${stats.occupancy.percentage}`;
    occupancyCard.querySelector('.card-footer').textContent = `${stats.occupancy.total} dolu`;
  }
  
  // 2. Aidat Ödeme Oranı
  const duesCard = document.getElementById('dues-card');
  if (duesCard) {
    duesCard.querySelector('.card-value').textContent = `%${stats.dues.percentage}`;
    duesCard.querySelector('.card-footer').textContent = stats.dues.display;
  }
  
  // 3. Aktif Duyurular
  const announcementCard = document.getElementById('announcement-card');
  if (announcementCard) {
    announcementCard.querySelector('.card-value').textContent = stats.announcements.active;
    announcementCard.querySelector('.card-footer').textContent = `${stats.announcements.total} toplam duyuru`;
  }
  
  // 4. Bekleyen Talepler
  const requestsCard = document.getElementById('requests-card');
  if (requestsCard) {
    requestsCard.querySelector('.card-value').textContent = stats.requests.pending;
    requestsCard.querySelector('.card-footer').textContent = `${stats.requests.total} toplam talep`;
  }
}

/**
 * Son duyuruları günceller
 */
function updateRecentAnnouncements(announcements) {
  const container = document.getElementById('current-announcements');
  
  if (!container) return;
  
  if (announcements.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 20px; color: #7f8c8d;">Henüz duyuru bulunmamaktadır.</p>';
    return;
  }
  
  // Duyuruları HTML'e dönüştür
  const announcementsHTML = announcements.map(announcement => `
    <div class="announcement-card ${getAnnouncementClass(announcement.status)}">
      <div class="announcement-header">
        <h3>${announcement.title}</h3>
        <span class="announcement-badge ${getAnnouncementClass(announcement.status)}">
          ${announcement.status}
        </span>
      </div>
      <p class="announcement-content">${announcement.content}</p>
      <div class="announcement-footer">
        <span class="announcement-date">
          <i class="fas fa-calendar"></i> 
          ${formatDate(announcement.start_date)} - ${formatDate(announcement.end_date)}
        </span>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = announcementsHTML;
}

/**
 * HELPER FUNCTIONS (Yardımcı Fonksiyonlar)
 */

// İsmin baş harflerini al (Avatar için)
function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Duyuru durumuna göre CSS class
function getAnnouncementClass(status) {
  const classes = {
    'Acil': 'urgent',
    'Önemli': 'important',
    'Normal': 'normal',
    'Planlanan': 'planned',
    'Geçmiş': 'past'
  };
  return classes[status] || 'normal';
}

// Tarihi formatla
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return date.toLocaleDateString('tr-TR', options);
}

// Loading göster
function showLoading() {
  const announcementsContainer = document.getElementById('current-announcements');
  if (announcementsContainer) {
    announcementsContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Yükleniyor...</p>';
  }
}

// Loading gizle
function hideLoading() {
  // Loading animasyonu kaldırıldı, veriler yüklendi
}

// Hata mesajı göster
function showError(message) {
  const announcementsContainer = document.getElementById('current-announcements');
  if (announcementsContainer) {
    announcementsContainer.innerHTML = `
      <div style="background: #fee; color: #c33; padding: 15px; border-radius: 8px; text-align: center;">
        <i class="fas fa-exclamation-triangle"></i> ${message}
      </div>
    `;
  }
  
  // İstatistik kartlarını sıfırla
  document.querySelectorAll('.card-value').forEach(el => el.textContent = '--');
  document.querySelectorAll('.card-footer').forEach(el => el.textContent = '--');
}

// Site ID'sini değiştir (Site seçimi için)
function changeSite(siteId) {
  currentSiteId = siteId;
  localStorage.setItem('currentSiteId', siteId);
  loadDashboard();
}

// Export (eğer module olarak kullanılıyorsa)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadDashboard, changeSite };
}
