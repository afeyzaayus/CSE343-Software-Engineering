// Complaints/Requests Page Script
const API_BASE_URL = 'http://localhost:3000/api';
const selectedSite = JSON.parse(localStorage.getItem('selectedSite'));
const SITE_ID = selectedSite?.site_id;
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    if (!selectedSite || !SITE_ID) {
        alert('Site seçilmedi. Ana sayfaya yönlendiriliyorsunuz.');
        window.location.href = '/admin-dashboard.html';
        return;
    }

    if (!currentUser) {
        window.location.href = '/login.html';
        return;
    }

    // Site adını göster
    const siteNameHeader = document.getElementById('site-name-header');
    if (siteNameHeader) {
        siteNameHeader.textContent = selectedSite.site_name;
    }

    // Kullanıcı adını göster
    const userName = document.getElementById('current-user-name');
    if (userName) {
        userName.textContent = currentUser.full_name || 'Kullanıcı';
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('selectedSite');
            window.location.href = '/admin-dashboard.html';
        });
    }

    // Şikayetleri yükle
    loadComplaints();
    setupFilters();
});

// Şikayetleri API'den çek
async function loadComplaints() {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    try {
        const response = await fetch(`${API_BASE_URL}/complaints?siteId=${SITE_ID}`, { headers });
        if (!response.ok) throw new Error('Şikayetler yüklenemedi');
        
        const result = await response.json();
        const complaints = result.data || result.complaints || [];
        
        renderComplaints(complaints);
    } catch (error) {
        console.error('Şikayetler yüklenirken hata:', error);
        alert('Şikayetler yüklenirken bir hata oluştu.');
    }
}

// Şikayetleri render et
function renderComplaints(complaints, filter = 'all') {
    const container = document.getElementById('complaints-list');
    if (!container) return;

    let filtered = complaints;
    if (filter !== 'all') {
        filtered = complaints.filter(c => c.status?.toLowerCase() === filter);
    }

    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#7f8c8d;">Şikayet/talep kaydı bulunmamaktadır.</p>';
        return;
    }

    container.innerHTML = filtered.map(complaint => {
        const statusColors = {
            'pending': '#f39c12',
            'inprogress': '#3498db',
            'resolved': '#27ae60'
        };
        const statusTexts = {
            'pending': 'Bekliyor',
            'inprogress': 'İşlemde',
            'resolved': 'Çözüldü'
        };
        const status = complaint.status?.toLowerCase() || 'pending';
        const color = statusColors[status] || '#95a5a6';
        const statusText = statusTexts[status] || 'Bilinmiyor';

        return `
        <div class="complaint-item" style="border-left:4px solid ${color};padding:15px;margin-bottom:15px;background:#f8f9fa;border-radius:4px;">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <div style="flex:1;">
                    <h4 style="margin:0 0 10px 0;color:#2c3e50;">${complaint.title || 'Şikayet/Talep'}</h4>
                    <p style="margin:0 0 10px 0;color:#7f8c8d;">${complaint.description || ''}</p>
                    <div style="font-size:12px;color:#95a5a6;">
                        <span><strong>Tarih:</strong> ${new Date(complaint.created_at).toLocaleDateString('tr-TR')}</span>
                        ${complaint.resident_name ? ` | <strong>Gönderen:</strong> ${complaint.resident_name}` : ''}
                    </div>
                </div>
                <div>
                    <span style="font-size:11px;padding:5px 10px;background:${color};color:white;border-radius:3px;">
                        ${statusText}
                    </span>
                </div>
            </div>
        </div>`;
    }).join('');
}

// Filtreleme butonları
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            loadComplaints().then(() => {
                // Re-render with filter
            });
        });
    });
}
