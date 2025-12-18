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

    // Kullanıcı bilgisini göster
    const userInfo = document.getElementById('dashboard-user-info');
    if (userInfo && currentUser) {
        userInfo.innerHTML = `
            <div class="user-avatar" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #2196F3; color: white; border-radius: 50%; font-weight: bold;">${(currentUser.full_name || 'A')[0].toUpperCase()}</div>
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
        if (!response.ok) {
            throw new Error('Şikayetler yüklenemedi');
        }
        
        const result = await response.json();
        console.log('API Yanıtı:', result);
        const complaints = result.data || result.complaints || [];
        
        renderComplaintsByStatus(complaints);
    } catch (error) {
        console.error('Şikayetler yüklenirken hata:', error);
        showErrorMessage('Şikayetler yüklenirken bir hata oluştu.');
    }
}

// Şikayetleri durumlarına göre render et
function renderComplaintsByStatus(complaints) {
    const pendingList = document.getElementById('pending-requests-list');
    const inprogressList = document.getElementById('inprogress-requests-list');
    const resolvedList = document.getElementById('resolved-requests-list');

    // Şikayetleri duruma göre ayır
    const pending = complaints.filter(c => c.status?.toLowerCase() === 'pending');
    const inprogress = complaints.filter(c => c.status?.toLowerCase() === 'in_progress' || c.status?.toLowerCase() === 'inprogress');
    const resolved = complaints.filter(c => c.status?.toLowerCase() === 'resolved');

    // Her liste için render et
    if (pendingList) {
        pendingList.innerHTML = renderComplaintsList(pending, 'Bekleyen şikayet/talep bulunmamaktadır.');
    }
    if (inprogressList) {
        inprogressList.innerHTML = renderComplaintsList(inprogress, 'İşlemdeki şikayet/talep bulunmamaktadır.');
    }
    if (resolvedList) {
        resolvedList.innerHTML = renderComplaintsList(resolved, 'Çözülen şikayet/talep bulunmamaktadır.');
    }
}

// Şikayet listesi HTML'i oluştur
function renderComplaintsList(complaints, emptyMessage) {
    if (complaints.length === 0) {
        return `<p style="text-align:center;color:#7f8c8d;padding:20px;">${emptyMessage}</p>`;
    }

    return complaints.map(complaint => {
        const statusColors = {
            'pending': '#f39c12',
            'in_progress': '#3498db',
            'inprogress': '#3498db',
            'resolved': '#27ae60'
        };
        const statusTexts = {
            'pending': 'Bekliyor',
            'in_progress': 'İşlemde',
            'inprogress': 'İşlemde',
            'resolved': 'Çözüldü'
        };
        const status = complaint.status?.toLowerCase() || 'pending';
        const color = statusColors[status] || '#95a5a6';
        const statusText = statusTexts[status] || 'Bilinmiyor';

        // Durum kontrolü
        let actionButtonsHTML = '';

        // Bekleyen durumda: İşleme Al ve Çöz butonlarını göster
        if (status === 'pending') {
            actionButtonsHTML += `
            <button class="btn-action btn-process" onclick="updateComplaintStatus(${complaint.id}, 'IN_PROGRESS')" title="İşleme al">
                <i class="fas fa-spinner"></i> İşleme Al
            </button>
            <button class="btn-action btn-resolve" onclick="updateComplaintStatus(${complaint.id}, 'RESOLVED')" title="Çöz">
                <i class="fas fa-check"></i> Çöz
            </button>
            <button class="btn-action btn-cancel" onclick="updateComplaintStatus(${complaint.id}, 'REJECTED')" title="İptal et">
                <i class="fas fa-times"></i> İptal Et
            </button>
            `;
        }
        // İşlemde durumda: Sadece Çöz butonunu göster
        else if (status === 'in_progress' || status === 'inprogress') {
            actionButtonsHTML += `
            <button class="btn-action btn-resolve" onclick="updateComplaintStatus(${complaint.id}, 'RESOLVED')" title="Çöz">
                <i class="fas fa-check"></i> Çöz
            </button>
            <button class="btn-action btn-cancel" onclick="updateComplaintStatus(${complaint.id}, 'REJECTED')" title="İptal et">
                <i class="fas fa-times"></i> İptal Et
            </button>
            `;
        }

        return `
        <div class="complaint-card" style="border-left:4px solid ${color};padding:15px;margin-bottom:15px;background:#f8f9fa;border-radius:4px;">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <div style="flex:1;">
                    <h4 style="margin:0 0 10px 0;color:#2c3e50;">${complaint.title || 'Şikayet/Talep'}</h4>
                    <p style="margin:0 0 10px 0;color:#7f8c8d;">${complaint.content || complaint.description || ''}</p>
                    <div style="font-size:12px;color:#95a5a6;">
                        <span><strong>Tarih:</strong> ${new Date(complaint.created_at).toLocaleDateString('tr-TR')}</span>
                        ${complaint.users?.full_name ? ` | <strong>Gönderen:</strong> ${complaint.users.full_name}` : ''}
                        ${complaint.users?.apartment_no ? ` - Daire: ${complaint.users.apartment_no}` : ''}
                    </div>
                    <div style="margin-top:12px; display:flex;gap:8px;flex-wrap:wrap;">
                        ${actionButtonsHTML}
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

// Hata mesajını göster
function showErrorMessage(message) {
    const pendingList = document.getElementById('pending-requests-list');
    const inprogressList = document.getElementById('inprogress-requests-list');
    const resolvedList = document.getElementById('resolved-requests-list');
    
    const errorHTML = `<p style="text-align:center;color:#e74c3c;padding:20px;">${message}</p>`;
    if (pendingList) pendingList.innerHTML = errorHTML;
    if (inprogressList) inprogressList.innerHTML = errorHTML;
    if (resolvedList) resolvedList.innerHTML = errorHTML;
}

// Filtreleme butonları
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const sections = {
        'pending': document.getElementById('pending-requests-section'),
        'inprogress': document.getElementById('inprogress-requests-section'),
        'resolved': document.getElementById('resolved-requests-section')
    };

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            
            // Tüm bölümleri göster/gizle
            if (filter === 'all') {
                Object.values(sections).forEach(section => {
                    if (section) section.style.display = 'block';
                });
            } else {
                Object.entries(sections).forEach(([key, section]) => {
                    if (section) {
                        section.style.display = (key === filter) ? 'block' : 'none';
                    }
                });
            }
        });
    });
}

// Şikayet durumunu güncelle
async function updateComplaintStatus(complaintId, newStatus) {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };

    const statusMessages = {
        'IN_PROGRESS': 'işleme almak',
        'RESOLVED': 'çözmek',
        'REJECTED': 'iptal etmek'
    };

    if (!confirm(`Bu talebi ${statusMessages[newStatus] || 'güncellemek'} istediğinize emin misiniz?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/status`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('API Error Response:', data);
            throw new Error(data.error || `HTTP ${response.status}: Güncelleme başarısız`);
        }

        alert('✅ Durum başarıyla güncellendi!');
        loadComplaints();

    } catch (error) {
        console.error('Güncelleme hatası:', error);
        alert('❌ İşlem başarısız oldu.\n\nHata: ' + error.message);
    }
}