// js/main.js

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Şikayetleri yükle ve göster
 */
async function loadComplaints(filter = 'all') {
    try {
        const siteId = getSiteId();
        
        if (!siteId) {
            console.error('Site ID bulunamadı');
            document.getElementById('site-name-header').textContent = 'Site Seçilmedi';
            return;
        }

        showLoading(true);

        const response = await fetch(`${API_BASE_URL}/complaints?siteId=${siteId}&status=${filter}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json(); 
        const complaints = result.data || []; 

        // Site adını başlığa yaz
        if (complaints.length > 0 && complaints[0].site) {
            const siteName = complaints[0].site.site_name;
            const headerElement = document.getElementById('site-name-header');
            if (headerElement) {
                headerElement.textContent = siteName;
            }
        } else {
            const headerElement = document.getElementById('site-name-header');
            if(headerElement) headerElement.textContent = 'Site Yönetimi';
        }
        
        const categorized = categorizeComplaints(complaints);

        renderComplaintsList('pending-requests-list', categorized.pending);
        renderComplaintsList('inprogress-requests-list', categorized.inprogress);
        renderComplaintsList('resolved-requests-list', categorized.resolved);

        updateSectionVisibility(filter);

    } catch (error) {
        console.error('Şikayetler yüklenirken hata:', error);
        showError('Şikayetler yüklenirken bir hata oluştu.');
    } finally {
        showLoading(false);
    }
}

/**
 * Header'daki Admin İsmini Backend'den Getir
 * Web paneline giriş yapan admin bilgisini çeker
 */
async function loadCurrentUser() {
    try {
        const userNameElement = document.getElementById('current-user-name');
        if (!userNameElement) return;

        // URL'den adminId al, yoksa 1 varsay
        const urlParams = new URLSearchParams(window.location.search);
        const adminId = urlParams.get('adminId') || urlParams.get('userId') || 1; 

        // Backend'den ADMIN bilgisini çek (admins tablosu)
        const response = await fetch(`${API_BASE_URL}/admins/${adminId}`);

        if (response.ok) {
            const result = await response.json();
            const admin = result.data || result; 
            
            if (admin.full_name) {
                userNameElement.textContent = admin.full_name;
                localStorage.setItem('adminName', admin.full_name);
            } else {
                userNameElement.textContent = "Yönetici";
            }
        } else {
            console.warn('Admin bilgisi çekilemedi, varsayılan kullanılıyor.');
            const cachedName = localStorage.getItem('adminName');
            userNameElement.textContent = cachedName || "Yönetici";
        }

    } catch (error) {
        console.error('Admin yüklenirken hata:', error);
        const cachedName = localStorage.getItem('adminName');
        const el = document.getElementById('current-user-name');
        if(el) el.textContent = cachedName || "Yönetici";
    }
}

// ============= HELPER FUNCTIONS =============

function categorizeComplaints(complaints) {
    if (!Array.isArray(complaints)) {
        return { pending: [], inprogress: [], resolved: [] };
    }

    return {
        pending: complaints.filter(c => c.status === 'PENDING'),
        inprogress: complaints.filter(c => c.status === 'IN_PROGRESS'),
        resolved: complaints.filter(c => 
            c.status === 'RESOLVED' || 
            c.status === 'CANCELLED' || 
            c.status === 'REJECTED'
        )
    };
}

function renderComplaintsList(containerId, complaints) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.warn(`Container bulunamadı: ${containerId}`);
        return;
    }

    if (complaints.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 40px 20px; color: #999;">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; color: #ddd;"></i>
                <p style="font-size: 16px; margin: 0;">Bu kategoride kayıt bulunamadı.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = complaints.map(complaint => createComplaintCard(complaint)).join('');
    attachComplaintEventListeners(container);
}

function createComplaintCard(complaint) {
    const blockNo = complaint.user?.block_no || 'N/A';
    const aptNo = complaint.user?.apartment_no || 'N/A';
    const userName = complaint.user?.full_name || 'Bilinmeyen Kullanıcı';
    const date = formatDate(complaint.created_at);
    
    const categoryText = complaint.categoryText || getCategoryText(complaint.category);
    const categoryClass = complaint.categoryClass || getCategoryClass(complaint.category);
    const statusText = complaint.statusText || getStatusText(complaint.status);
    const statusClass = complaint.statusClass || getStatusClass(complaint.status);
    
    return `
        <div class="complaint-card" data-complaint-id="${complaint.id}">
            <div class="complaint-header">
                <div class="complaint-info">
                    <span class="category-badge ${categoryClass}">
                        ${categoryText}
                    </span>
                    <h3>${escapeHtml(complaint.title)}</h3>
                    <span class="complaint-meta">
                        <i class="fas fa-user"></i> ${escapeHtml(userName)} |
                        <i class="fas fa-building"></i> Blok: ${blockNo}, Daire: ${aptNo} |
                        <i class="fas fa-calendar"></i> ${date}
                    </span>
                </div>
                <span class="complaint-status ${statusClass}">
                    ${statusText}
                </span>
            </div>
            <div class="complaint-content">
                <p>${escapeHtml(complaint.content)}</p>
            </div>
            <div class="complaint-actions">
                ${renderActionButtons(complaint)}
            </div>
        </div>
    `;
}

function renderActionButtons(complaint) {
    const baseButtons = `
        <button class="btn-action btn-detail" data-action="detail" data-id="${complaint.id}">
            <i class="fas fa-eye"></i> Detay
        </button>
    `;

    if (!isAdmin()) {
        return baseButtons;
    }

    if (complaint.status === 'PENDING') {
        return baseButtons + `
            <button class="btn-action btn-process" data-action="process" data-id="${complaint.id}">
                <i class="fas fa-spinner"></i> İşleme Al
            </button>
            <button class="btn-action btn-resolve" data-action="resolve" data-id="${complaint.id}">
                <i class="fas fa-check"></i> Çöz
            </button>
            <button class="btn-action btn-cancel" data-action="cancel" data-id="${complaint.id}">
                <i class="fas fa-times"></i> İptal Et
            </button>
        `;
    } 
    
    if (complaint.status === 'IN_PROGRESS') {
        return baseButtons + `
            <button class="btn-action btn-resolve" data-action="resolve" data-id="${complaint.id}">
                <i class="fas fa-check"></i> Çöz
            </button>
            <button class="btn-action btn-cancel" data-action="cancel" data-id="${complaint.id}">
                <i class="fas fa-times"></i> İptal Et
            </button>
        `;
    }

    return baseButtons;
}

function attachComplaintEventListeners(container) {
    container.querySelectorAll('.btn-action').forEach(button => {
        button.addEventListener('click', handleComplaintAction);
    });
}

async function handleComplaintAction(event) {
    const button = event.currentTarget;
    const action = button.dataset.action;
    const complaintId = button.dataset.id;

    button.disabled = true;
    button.style.opacity = '0.6';

    try {
        switch (action) {
            case 'detail':
                await showComplaintDetail(complaintId);
                break;
            case 'process':
                await updateComplaintStatus(complaintId, 'IN_PROGRESS');
                break;
            case 'resolve':
                await updateComplaintStatus(complaintId, 'RESOLVED');
                break;
            case 'cancel':
                await updateComplaintStatus(complaintId, 'CANCELLED');
                break;
        }
    } catch(error) {
        console.error('İşlem hatası:', error);
    } finally {
        button.disabled = false;
        button.style.opacity = '1';
    }
}

async function showComplaintDetail(complaintId) {
    try {
        const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}`);
        
        if (!response.ok) {
            throw new Error('Detay alınamadı');
        }
        
        const data = await response.json();
        const complaint = data.data || data;

        alert(`
═══════════════════════════
     TALEP DETAYLARI
═══════════════════════════

📋 Başlık: ${complaint.title}

📝 İçerik: 
${complaint.content}

📊 Durum: ${getStatusText(complaint.status)}

🏷️  Kategori: ${getCategoryText(complaint.category)}

👤 Kullanıcı: ${complaint.user?.full_name || 'N/A'}

🏠 Konum: Blok ${complaint.user?.block_no || 'N/A'}, Daire ${complaint.user?.apartment_no || 'N/A'}

📅 Oluşturulma: ${formatDate(complaint.created_at)}

🔄 Güncellenme: ${formatDate(complaint.updated_at)}
        `);
    } catch (error) {
        console.error('Detay yükleme hatası:', error);
        alert('Detaylar yüklenemedi. Lütfen tekrar deneyin.');
    }
}

async function updateComplaintStatus(complaintId, newStatus) {
    const statusMessages = {
        'IN_PROGRESS': 'işleme almak',
        'RESOLVED': 'çözmek',
        'CANCELLED': 'iptal etmek'
    };

    if (!confirm(`Bu talebi ${statusMessages[newStatus] || 'güncellemek'} istediğinize emin misiniz?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/status`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Güncelleme başarısız');
        }

        const result = await response.json();
        
        showSuccess(result.message || 'Durum başarıyla güncellendi!');
        loadComplaints(getCurrentFilter());

    } catch (error) {
        console.error('Güncelleme hatası:', error);
        showError('İşlem başarısız oldu. Lütfen tekrar deneyin.');
    }
}

// ============= UI HELPER FUNCTIONS =============

function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filter = button.dataset.filter;
            loadComplaints(filter);
        });
    });

    if (filterButtons.length > 0) {
        filterButtons[0].classList.add('active');
    }
}

function updateSectionVisibility(filter) {
    const sections = {
        'pending-requests-section': filter === 'all' || filter === 'pending',
        'inprogress-requests-section': filter === 'all' || filter === 'inprogress',
        'resolved-requests-section': filter === 'all' || filter === 'resolved'
    };

    Object.keys(sections).forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = sections[sectionId] ? 'block' : 'none';
        }
    });
}

function getCurrentFilter() {
    const activeButton = document.querySelector('.filter-btn.active');
    return activeButton ? activeButton.dataset.filter : 'all';
}

function showLoading(show) {
    const containers = [
        'pending-requests-list', 
        'inprogress-requests-list', 
        'resolved-requests-list'
    ];
    
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el && show) {
            el.innerHTML = `
                <div style="text-align:center; padding: 40px; color: #999;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 32px;"></i>
                    <p style="margin-top: 15px;">Yükleniyor...</p>
                </div>
            `;
        }
    });
}

function showError(message) {
    alert('❌ ' + message);
}

function showSuccess(message) {
    alert('✅ ' + message);
}

// ============= UTILITY FUNCTIONS =============

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString('tr-TR', { 
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
    } catch (error) {
        return dateString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCategoryText(category) { 
    const categoryMap = { 
        'MAINTENANCE': 'Bakım', 
        'COMPLAINT': 'Şikayet', 
        'REQUEST': 'Talep', 
        'OTHER': 'Diğer' 
    };
    return categoryMap[category] || 'Diğer';
}

function getCategoryClass(category) { 
    return 'category-' + (category?.toLowerCase() || 'other'); 
}

function getStatusText(status) {
    const statusMap = { 
        'PENDING': 'Bekliyor', 
        'IN_PROGRESS': 'İşlemde', 
        'RESOLVED': 'Çözüldü', 
        'CANCELLED': 'İptal Edildi', 
        'REJECTED': 'Reddedildi' 
    };
    return statusMap[status] || status;
}

function getStatusClass(status) { 
    const normalized = status?.toLowerCase().replace('_', '');
    return 'status-' + (normalized || 'pending'); 
}

function getSiteId() {
    const urlParams = new URLSearchParams(window.location.search);
    const siteIdFromUrl = urlParams.get('siteId');
    
    if (siteIdFromUrl) {
        localStorage.setItem('siteId', siteIdFromUrl);
        return siteIdFromUrl;
    }
    
    const siteIdFromStorage = localStorage.getItem('siteId');
    if (siteIdFromStorage) return siteIdFromStorage;
    
    return '1';
}

function isAdmin() {
    return true; 
}

// ============= INITIALIZATION =============

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Complaints modülü yüklendi');
    
    initializeFilters();
    loadComplaints('all');
    loadCurrentUser();
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
                localStorage.clear();
                window.location.href = '/login.html';
            }
        });
    }
});