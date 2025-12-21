import { createStatusBadge, showToast, formatDate } from './common.js';

const API_BASE_URL = 'http://localhost:3000/api';

let currentIndividualId = null;
let individualsData = [];

// Token al
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
}

// ===========================
// BİREYSEL HESAP API FONKSİYONLARI
// ===========================

async function fetchAllIndividuals(filters = {}) {
    const params = new URLSearchParams();
    if (filters.includeDeleted) params.append('includeDeleted', 'true');
    if (filters.status) params.append('status', filters.status);

    const response = await fetch(`${API_BASE_URL}/master/individuals?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Bireysel hesaplar yüklenemedi');
    }

    const data = await response.json();
    return data.data || data.individuals || data;
}

async function fetchIndividualById(individualId) {
    const response = await fetch(`${API_BASE_URL}/master/individuals/${individualId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Hesap detayı yüklenemedi');
    }

    const data = await response.json();
    return data.data || data.individual || data;
}

async function fetchIndividualStats() {
    const response = await fetch(`${API_BASE_URL}/master/individuals/statistics`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'İstatistikler yüklenemedi');
    }

    const data = await response.json();
    return data.data || data;
}

async function updateIndividualStatus(individualId, status) {
    const response = await fetch(`${API_BASE_URL}/master/individuals/${individualId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: status }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Durum güncellenemedi');
    }

    return response.json();
}

async function softDeleteIndividual(individualId) {
    const response = await fetch(`${API_BASE_URL}/master/individuals/${individualId}/soft`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Hesap silinemedi');
    }

    return response.json();
}

async function restoreIndividual(individualId) {
    const response = await fetch(`${API_BASE_URL}/master/individuals/${individualId}/restore`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Hesap geri yüklenemedi');
    }

    return response.json();
}

async function hardDeleteIndividual(individualId) {
    const response = await fetch(`${API_BASE_URL}/master/individuals/${individualId}/hard`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Hesap kalıcı olarak silinemedi');
    }

    return response.json();
}

// ===========================
// BİREYSEL HESAP SİTELERİ API FONKSİYONLARI
// ===========================

async function fetchIndividualSites(individualId) {
    const response = await fetch(`${API_BASE_URL}/master/individuals/${individualId}/site`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Site yüklenemedi');
    }

    const data = await response.json();
    // Backend'den tek site döndüğü için array'e çeviriyoruz
    return Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
}

async function updateSiteStatus(siteId, status) {
    const response = await fetch(`${API_BASE_URL}/master/individuals/sites/${siteId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: status }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Durum güncellenemedi');
    }

    return response.json();
}

async function softDeleteSite(siteId) {
    const response = await fetch(`${API_BASE_URL}/master/individuals/sites/${siteId}/soft`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Site silinemedi');
    }

    return response.json();
}

async function restoreSite(siteId) {
    const response = await fetch(`${API_BASE_URL}/master/individuals/sites/${siteId}/restore`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Site geri yüklenemedi');
    }

    return response.json();
}

async function hardDeleteSite(siteId) {
    const response = await fetch(`${API_BASE_URL}/master/individuals/sites/${siteId}/hard`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Site kalıcı olarak silinemedi');
    }

    return response.json();
}

// ===========================
// İSTATİSTİKLER
// ===========================

async function loadIndividualStats() {
    try {
        const stats = await fetchIndividualStats();
        
        document.getElementById('totalIndividualsCount').textContent = stats.total || 0;
        document.getElementById('activeIndividualsCount').textContent = stats.active || 0;
        document.getElementById('suspendedIndividualsCount').textContent = stats.suspended || 0;
        document.getElementById('deletedIndividualsCount').textContent = stats.deleted || 0;
    } catch (error) {
        console.error('Stats load error:', error);
        document.getElementById('totalIndividualsCount').textContent = '0';
        document.getElementById('activeIndividualsCount').textContent = '0';
        document.getElementById('suspendedIndividualsCount').textContent = '0';
        document.getElementById('deletedIndividualsCount').textContent = '0';
    }
}

// ===========================
// UI FONKSİYONLARI
// ===========================

async function loadIndividuals() {
    try {
        const filters = {
            includeDeleted: document.getElementById('showDeletedIndividuals')?.checked || false,
            status: document.getElementById('individualStatusFilter')?.value !== 'all' 
                ? document.getElementById('individualStatusFilter')?.value 
                : null,
        };

        const individuals = await fetchAllIndividuals(filters);
        individualsData = Array.isArray(individuals) ? individuals : [];
        displayIndividuals(individualsData);
        
        await loadIndividualStats();
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Load individuals error:', error);
    }
}

function displayIndividuals(individuals) {
    const container = document.getElementById('individualsList');
    
    if (!Array.isArray(individuals)) {
        console.error('Individuals is not an array:', individuals);
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p class="empty-state-text">Veri formatı hatalı</p></div>';
        return;
    }
    
    if (individuals.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👤</div><p class="empty-state-text">Bireysel hesap bulunamadı</p></div>';
        return;
    }

    container.innerHTML = individuals.map(individual => {
        const siteCount = individual.sites?.length || individual.site_count || 0;
        
        return `
            <div class="list-item ${individual.deleted_at ? 'deleted' : ''}" data-id="${individual.id}">
                <div class="company-header" onclick="viewIndividualDetail(${individual.id})">
                    <h4>${individual.full_name || 'İsimsiz Kullanıcı'}</h4>
                    ${createStatusBadge(individual.account_status)}
                </div>
                <div class="company-info" onclick="viewIndividualDetail(${individual.id})">
                    <p><strong>Email:</strong> ${individual.email || '-'}</p>
                    <p><strong>Oluşturma:</strong> ${formatDate(individual.created_at)}</p>
                    <p><strong>Son Giriş:</strong> ${individual.last_login ? formatDate(individual.last_login) : 'Hiç giriş yapmamış'}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); viewIndividualDetail(${individual.id})">
                        <span class="btn-icon">👁️</span> Detay
                    </button>
                    ${individual.deleted_at ? `
                        <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); handleRestoreIndividual(${individual.id})">
                            <span class="btn-icon">↩️</span> Geri Yükle
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); handleHardDeleteIndividual(${individual.id})">
                            <span class="btn-icon">🗑️</span> Kalıcı Sil
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function viewIndividualDetail(individualId) {
    try {
        currentIndividualId = individualId;
        const individual = await fetchIndividualById(individualId);
        
        document.getElementById('individualsContent').classList.remove('active');
        document.getElementById('individualDetailContent').classList.add('active');
        
        displayIndividualDetail(individual);
        await loadIndividualSites(individualId);
    } catch (error) {
        showToast(error.message, 'error');
        console.error('View individual detail error:', error);
    }
}

function displayIndividualDetail(individual) {
    const container = document.getElementById('individualDetailInfo');
    const deletedBadge = individual.deleted_at ? '<span class="deleted-badge">Silinmiş</span>' : '';
    
    container.innerHTML = `
        <div class="company-detail-header">
            <h2>${individual.full_name || 'İsimsiz Kullanıcı'} ${deletedBadge}</h2>
            ${createStatusBadge(individual.account_status)}
        </div>
        <div class="company-detail-info">
            <p><strong>Email:</strong> ${individual.email || '-'}</p>
            <p><strong>Oluşturma Tarihi:</strong> ${formatDate(individual.created_at)}</p>
            <p><strong>Son Giriş:</strong> ${individual.last_login ? formatDate(individual.last_login) : 'Hiç giriş yapmamış'}</p>
            ${individual.deleted_at ? `<p><strong>Silinme Tarihi:</strong> ${formatDate(individual.deleted_at)}</p>` : ''}
        </div>
    `;
    
    // Butonları güncelle
    const suspendBtn = document.getElementById('suspendIndividualBtn');
    const activateBtn = document.getElementById('activateIndividualBtn');
    const deleteBtn = document.getElementById('deleteIndividualBtn');
    
    if (individual.deleted_at) {
        suspendBtn.style.display = 'none';
        activateBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
    } else {
        deleteBtn.style.display = 'inline-flex';
        if (individual.account_status === 'ACTIVE') {
            suspendBtn.style.display = 'inline-flex';
            activateBtn.style.display = 'none';
        } else {
            suspendBtn.style.display = 'none';
            activateBtn.style.display = 'inline-flex';
        }
    }
}

// ===========================
// SITE GÖSTERIM FONKSİYONLARI
// ===========================

async function loadIndividualSites(individualId) {
    try {
        const filters = {
            includeDeleted: document.getElementById('showDeletedSites')?.checked || false,
        };

        const sites = await fetchIndividualSites(individualId, filters);
        displayIndividualSites(sites);
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Load sites error:', error);
    }
}

function displayIndividualSites(sites) {
    const container = document.getElementById('sitesGrid');
    
    const sitesArray = Array.isArray(sites) ? sites : [];
    
    if (sitesArray.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏘️</div><p class="empty-state-text">Site bulunamadı</p></div>';
        return;
    }

    container.innerHTML = sitesArray.map(site => `
        <div class="account-card ${site.deleted_at ? 'deleted' : ''}" data-id="${site.id}">
            <div class="account-header">
                <h4>${site.site_name || 'İsimsiz Site'}</h4>
                ${createStatusBadge(site.site_status || site.status)}
            </div>
            <div class="account-details">
                <p class="company-info">📍 ${site.site_address || '-'}</p>
                <p><strong>Blok Sayısı:</strong> ${site.block_count || 0}</p>
                <p><strong>Daire Sayısı:</strong> ${site.apartment_count || 0}</p>
                ${site.deleted_at ? `<p><strong>Silinme Tarihi:</strong> ${formatDate(site.deleted_at)}</p>` : ''}
            </div>
            <div class="card-actions">
                ${getSiteActionButtons(site)}
            </div>
        </div>
    `).join('');
}

function getSiteActionButtons(site) {
    if (site.deleted_at) {
        return `
            <button class="btn btn-success btn-xs" onclick="handleRestoreSite(${site.id})">
                <span class="btn-icon">↩️</span> Geri Yükle
            </button>
            <button class="btn btn-danger btn-xs" onclick="handleHardDeleteSite(${site.id})">
                <span class="btn-icon">🗑️</span> Kalıcı Sil
            </button>
        `;
    } else {
        const siteStatus = site.site_status || site.status;
        const statusButton = siteStatus === 'ACTIVE'
            ? `<button class="btn btn-warning btn-xs" onclick="handleSuspendSite(${site.id})">
                   <span class="btn-icon">⏸️</span> Askıya Al
               </button>`
            : `<button class="btn btn-success btn-xs" onclick="handleActivateSite(${site.id})">
                   <span class="btn-icon">▶️</span> Aktif Et
               </button>`;
        
        return `
            ${statusButton}
            <button class="btn btn-danger btn-xs" onclick="handleSoftDeleteSite(${site.id})">
                <span class="btn-icon">🗑️</span> Sil
            </button>
        `;
    }
}

// ===========================
// BİREYSEL HESAP İŞLEMLERİ
// ===========================

async function handleActivateIndividualDetail() {
    if (!currentIndividualId) return;
    if (!confirm('Hesabı aktif etmek istediğinizden emin misiniz?')) return;
    
    try {
        await updateIndividualStatus(currentIndividualId, 'ACTIVE');
        showToast('Hesap aktif edildi', 'success');
        await viewIndividualDetail(currentIndividualId);
        await loadIndividuals();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSuspendIndividualDetail() {
    if (!currentIndividualId) return;
    if (!confirm('Hesabı askıya almak istediğinizden emin misiniz?')) return;
    
    try {
        await updateIndividualStatus(currentIndividualId, 'SUSPENDED');
        showToast('Hesap askıya alındı', 'success');
        await viewIndividualDetail(currentIndividualId);
        await loadIndividuals();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSoftDeleteIndividualDetail() {
    if (!currentIndividualId) return;
    if (!confirm('Hesabı silmek istediğinizden emin misiniz? Bu işlem geri alınabilir.')) return;
    
    try {
        await softDeleteIndividual(currentIndividualId);
        showToast('Hesap silindi', 'success');
        document.getElementById('individualDetailContent').classList.remove('active');
        document.getElementById('individualsContent').classList.add('active');
        await loadIndividuals();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleRestoreIndividual(individualId) {
    if (!confirm('Hesabı geri yüklemek istediğinizden emin misiniz?')) return;
    
    try {
        await restoreIndividual(individualId);
        showToast('Hesap geri yüklendi', 'success');
        await loadIndividuals();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleHardDeleteIndividual(individualId) {
    if (!confirm('UYARI: Bu işlem geri alınamaz! Hesabı kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    
    try {
        await hardDeleteIndividual(individualId);
        showToast('Hesap kalıcı olarak silindi', 'success');
        await loadIndividuals();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ===========================
// SITE İŞLEMLERİ
// ===========================

async function handleActivateSite(siteId) {
    if (!confirm('Site\'yi aktif etmek istediğinizden emin misiniz?')) return;
    
    try {
        await updateSiteStatus(siteId, 'ACTIVE');
        showToast('Site aktif edildi', 'success');
        await loadIndividualSites(currentIndividualId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSuspendSite(siteId) {
    if (!confirm('Site\'yi askıya almak istediğinizdan emin misiniz?')) return;
    
    try {
        await updateSiteStatus(siteId, 'SUSPENDED');
        showToast('Site askıya alındı', 'success');
        await loadIndividualSites(currentIndividualId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSoftDeleteSite(siteId) {
    if (!confirm('Site\'yi silmek istediğinizden emin misiniz?')) return;
    
    try {
        await softDeleteSite(siteId);
        showToast('Site silindi', 'success');
        await loadIndividualSites(currentIndividualId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleRestoreSite(siteId) {
    if (!confirm('Site\'yi geri yüklemek istediğinizden emin misiniz?')) return;
    
    try {
        await restoreSite(siteId);
        showToast('Site geri yüklendi', 'success');
        await loadIndividualSites(currentIndividualId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleHardDeleteSite(siteId) {
    if (!confirm('UYARI: Bu işlem geri alınamaz! Site\'yi kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    
    try {
        await hardDeleteSite(siteId);
        showToast('Site kalıcı olarak silindi', 'success');
        await loadIndividualSites(currentIndividualId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ===========================
// EVENT LISTENERS
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    loadIndividuals();
    loadIndividualStats();

    // Filtreler
    document.getElementById('individualSearch')?.addEventListener('input', async (e) => {
        const query = e.target.value.toLowerCase();
        if (!query) {
            // Arama kutusu boşsa, API'den tekrar veri çek
            await loadIndividuals();
            return;
        }
        const filtered = individualsData.filter(i => 
            (i.full_name || '').toLowerCase().includes(query) ||
            (i.email || '').toLowerCase().includes(query)
        );
        displayIndividuals(filtered);
    });

    document.getElementById('individualStatusFilter')?.addEventListener('change', loadIndividuals);
    document.getElementById('showDeletedIndividuals')?.addEventListener('change', loadIndividuals);
    document.getElementById('showDeletedSites')?.addEventListener('change', () => {
        if (currentIndividualId) loadIndividualSites(currentIndividualId);
    });

    // Geri butonu
    document.getElementById('backToIndividuals')?.addEventListener('click', () => {
        document.getElementById('individualDetailContent').classList.remove('active');
        document.getElementById('individualsContent').classList.add('active');
        currentIndividualId = null;
    });

    // Bireysel Hesap Detay Butonları
    document.getElementById('suspendIndividualBtn')?.addEventListener('click', handleSuspendIndividualDetail);
    document.getElementById('activateIndividualBtn')?.addEventListener('click', handleActivateIndividualDetail);
    document.getElementById('deleteIndividualBtn')?.addEventListener('click', handleSoftDeleteIndividualDetail);
});

// Global fonksiyonlar
window.viewIndividualDetail = viewIndividualDetail;
window.handleRestoreIndividual = handleRestoreIndividual;
window.handleHardDeleteIndividual = handleHardDeleteIndividual;
window.handleActivateSite = handleActivateSite;
window.handleSuspendSite = handleSuspendSite;
window.handleSoftDeleteSite = handleSoftDeleteSite;
window.handleRestoreSite = handleRestoreSite;
window.handleHardDeleteSite = handleHardDeleteSite;