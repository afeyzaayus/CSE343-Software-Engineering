import { createStatusBadge, showToast, formatDate } from './common.js';

const API_BASE_URL = 'http://localhost:3000/api';

let currentCompanyId = null;
let currentEditingAdmin = null;
let companiesData = [];

// Token al
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
}

// ===========================
// ŞİRKET YÖNETİMİ API FONKSİYONLARI
// ===========================

async function fetchAllCompanies(filters = {}) {
    const params = new URLSearchParams();
    if (filters.includeDeleted) params.append('includeDeleted', 'true');
    if (filters.status) params.append('status', filters.status);

    const response = await fetch(`${API_BASE_URL}/master/company?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Şirketler yüklenemedi');
    }

    const data = await response.json();
    return data.data || data.companies || data;
}

async function fetchCompanyById(companyId) {
    const response = await fetch(`${API_BASE_URL}/master/company/${companyId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Şirket detayı yüklenemedi');
    }

    const data = await response.json();
    return data.data || data.company || data;
}

async function fetchCompanyStats() {
    const response = await fetch(`${API_BASE_URL}/master/company/stats/counts`, {
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

async function updateCompany(companyId, companyData) {
    const response = await fetch(`${API_BASE_URL}/master/company/${companyId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(companyData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Şirket güncellenemedi');
    }

    return response.json();
}

async function updateCompanyStatus(companyId, status) {
    const response = await fetch(`${API_BASE_URL}/master/company/${companyId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ account_status: status }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Durum güncellenemedi');
    }

    return response.json();
}

async function softDeleteCompany(companyId) {
    const response = await fetch(`${API_BASE_URL}/master/company/${companyId}/soft`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Şirket silinemedi');
    }

    return response.json();
}

async function restoreCompany(companyId) {
    const response = await fetch(`${API_BASE_URL}/master/company/${companyId}/restore`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Şirket geri yüklenemedi');
    }

    return response.json();
}

async function hardDeleteCompany(companyId) {
    const response = await fetch(`${API_BASE_URL}/master/company/${companyId}/hard`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Şirket kalıcı olarak silinemedi');
    }

    return response.json();
}

// ===========================
// ŞİRKET ÇALIŞANLARI API FONKSİYONLARI
// ===========================

async function fetchCompanyAdmins(companyId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.includeDeleted) params.append('includeDeleted', 'true');
    if (filters.status) params.append('status', filters.status);

    const response = await fetch(`${API_BASE_URL}/master/company/${companyId}/admins?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Çalışanlar yüklenemedi');
    }

    const data = await response.json();
    return data.data || data.admins || data;
}

async function updateAdminRole(adminId, newRole) {
    const response = await fetch(`${API_BASE_URL}/master/company/admins/${adminId}/role`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Rol güncellenemedi');
    }

    return response.json();
}

async function updateAdminStatus(adminId, status) {
    const response = await fetch(`${API_BASE_URL}/master/company/admins/${adminId}/status`, {
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

async function softDeleteAdmin(adminId) {
    const response = await fetch(`${API_BASE_URL}/master/company/admins/${adminId}/soft`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Çalışan silinemedi');
    }

    return response.json();
}

async function restoreAdmin(adminId) {
    const response = await fetch(`${API_BASE_URL}/master/company/admins/${adminId}/restore`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Çalışan geri yüklenemedi');
    }

    return response.json();
}

async function hardDeleteAdmin(adminId) {
    const response = await fetch(`${API_BASE_URL}/master/company/admins/${adminId}/hard`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Çalışan kalıcı olarak silinemedi');
    }

    return response.json();
}
// ===========================
// ŞİRKET SİTELERİ API FONKSİYONLARI
// ===========================

async function fetchCompanySites(companyId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.includeDeleted) params.append('includeDeleted', 'true');
    if (filters.status) params.append('status', filters.status);

    const response = await fetch(`${API_BASE_URL}/master/company/${companyId}/sites?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Siteler yüklenemedi');
    }

    const data = await response.json();
    return data.data || data.sites || data;
}

async function updateSiteStatus(siteId, status) {
    const response = await fetch(`${API_BASE_URL}/master/company/sites/${siteId}/status`, {
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
    const response = await fetch(`${API_BASE_URL}/master/company/sites/${siteId}/soft`, {
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
    const response = await fetch(`${API_BASE_URL}/master/company/sites/${siteId}/restore`, {
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
    const response = await fetch(`${API_BASE_URL}/master/company/sites/${siteId}/hard`, {
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

async function loadCompanyStats() {
    try {
        const stats = await fetchCompanyStats();
        
        document.getElementById('totalCompaniesCount').textContent = stats.total || 0;
        document.getElementById('activeCompaniesCount').textContent = stats.active || 0;
        document.getElementById('suspendedCompaniesCount').textContent = stats.suspended || 0;
        document.getElementById('deletedCompaniesCount').textContent = stats.deleted || 0;
    } catch (error) {
        console.error('Stats load error:', error);
        document.getElementById('totalCompaniesCount').textContent = '0';
        document.getElementById('activeCompaniesCount').textContent = '0';
        document.getElementById('suspendedCompaniesCount').textContent = '0';
        document.getElementById('deletedCompaniesCount').textContent = '0';
    }
}

// ===========================
// UI FONKSİYONLARI
// ===========================

async function loadCompanies() {
    try {
        const filters = {
            includeDeleted: document.getElementById('showDeletedCompanies')?.checked || false,
            status: document.getElementById('companyStatusFilter')?.value !== 'all' 
                ? document.getElementById('companyStatusFilter')?.value 
                : null,
        };

        const companies = await fetchAllCompanies(filters);
        companiesData = Array.isArray(companies) ? companies : [];
        displayCompanies(companiesData);
        
        await loadCompanyStats();
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Load companies error:', error);
    }
}

function displayCompanies(companies) {
    const container = document.getElementById('companiesList');
    
    if (!Array.isArray(companies)) {
        console.error('Companies is not an array:', companies);
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p class="empty-state-text">Veri formatı hatalı</p></div>';
        return;
    }
    
    if (companies.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏢</div><p class="empty-state-text">Şirket bulunamadı</p></div>';
        return;
    }

    container.innerHTML = companies.map(company => {
        const siteCount = company.sites?.length || company.site_count || 0;
        const adminCount = company.admins?.length || company.admin_count || 0;
        
        return `
            <div class="list-item ${company.deleted_at ? 'deleted' : ''}" data-id="${company.id}">
                <div class="company-header" onclick="viewCompanyDetail(${company.id})">
                    <h4>${company.company_name || 'İsimsiz Şirket'}</h4>
                    ${createStatusBadge(company.account_status)}
                </div>
                <div class="company-info" onclick="viewCompanyDetail(${company.id})">
                    <p><strong>Kod:</strong> ${company.company_code || '-'}</p>
                    <p><strong>Site Sayısı:</strong> ${siteCount}</p>
                    <p><strong>Çalışan Sayısı:</strong> ${adminCount}</p>
                    <p><strong>Oluşturma:</strong> ${formatDate(company.created_at)}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); viewCompanyDetail(${company.id})">
                        <span class="btn-icon">👁️</span> Detay
                    </button>
                    ${company.deleted_at ? `
                        <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); handleRestoreCompany(${company.id})">
                            <span class="btn-icon">↩️</span> Geri Yükle
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); handleHardDeleteCompany(${company.id})">
                            <span class="btn-icon">🗑️</span> Kalıcı Sil
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function viewCompanyDetail(companyId) {
    try {
        currentCompanyId = companyId;
        const company = await fetchCompanyById(companyId);
        
        document.getElementById('companiesContent').classList.remove('active');
        document.getElementById('companyDetailContent').classList.add('active');
        
        displayCompanyDetail(company);
        await loadCompanySites(companyId);
        await loadCompanyEmployees(companyId);
    } catch (error) {
        showToast(error.message, 'error');
        console.error('View company detail error:', error);
    }
}

function displayCompanyDetail(company) {
    const container = document.getElementById('companyDetailInfo');
    const deletedBadge = company.deleted_at ? '<span class="deleted-badge">Silinmiş</span>' : '';
    
    container.innerHTML = `
        <div class="company-detail-header">
            <h2>${company.company_name || 'İsimsiz Şirket'} ${deletedBadge}</h2>
            ${createStatusBadge(company.account_status)}
        </div>
        <div class="company-detail-info">
            <p><strong>Şirket Kodu:</strong> ${company.company_code || '-'}</p>
            <p><strong>Oluşturma Tarihi:</strong> ${formatDate(company.created_at)}</p>
            ${company.deleted_at ? `<p><strong>Silinme Tarihi:</strong> ${formatDate(company.deleted_at)}</p>` : ''}
        </div>
    `;
    
    // Butonları güncelle
    const suspendBtn = document.getElementById('suspendCompanyBtn');
    const activateBtn = document.getElementById('activateCompanyBtn');
    const deleteBtn = document.getElementById('deleteCompanyBtn');
    
    if (company.deleted_at) {
        suspendBtn.style.display = 'none';
        activateBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
    } else {
        deleteBtn.style.display = 'inline-flex';
        if (company.account_status === 'ACTIVE') {
            suspendBtn.style.display = 'inline-flex';
            activateBtn.style.display = 'none';
        } else {
            suspendBtn.style.display = 'none';
            activateBtn.style.display = 'inline-flex';
        }
    }
}

// ===========================
// SITE VE ÇALIŞAN GÖSTERIM FONKSİYONLARI
// ===========================

async function loadCompanySites(companyId) {
    try {
        const filters = {
            includeDeleted: document.getElementById('showDeletedSites')?.checked || false,
        };

        const sites = await fetchCompanySites(companyId, filters);
        displayCompanySites(sites);
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Load sites error:', error);
    }
}

function displayCompanySites(sites) {
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

async function loadCompanyEmployees(companyId) {
    try {
        const filters = {
            includeDeleted: document.getElementById('showDeletedEmployees')?.checked || false,
        };

        const employees = await fetchCompanyAdmins(companyId, filters);
        displayCompanyEmployees(employees);
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Load employees error:', error);
    }
}

function displayCompanyEmployees(employees) {
    const container = document.getElementById('employeesGrid');
    
    const employeesArray = Array.isArray(employees) ? employees : [];
    
    if (employeesArray.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><p class="empty-state-text">Çalışan bulunamadı</p></div>';
        return;
    }

    container.innerHTML = employeesArray.map(emp => `
        <div class="account-card ${emp.deleted_at ? 'deleted' : ''}" data-id="${emp.id}">
            <div class="account-header">
                <h4>${emp.full_name || emp.name || 'İsimsiz'}</h4>
                ${createStatusBadge(emp.account_status)}
            </div>
            <div class="account-details">
                <p class="account-email">📧 ${emp.email || '-'}</p>
                <p><strong>Rol:</strong> ${emp.account_type === 'COMPANY_MANAGER' ? 'Şirket Yöneticisi' : 'Şirket Çalışanı'}</p>
                <p><strong>Son Giriş:</strong> ${emp.last_login ? formatDate(emp.last_login) : 'Hiç giriş yapmamış'}</p>
                ${emp.deleted_at ? `<p><strong>Silinme Tarihi:</strong> ${formatDate(emp.deleted_at)}</p>` : ''}
            </div>
            <div class="card-actions">
                ${getEmployeeActionButtons(emp)}
            </div>
        </div>
    `).join('');
}

function getEmployeeActionButtons(employee) {
    if (employee.deleted_at) {
        return `
            <button class="btn btn-success btn-xs" onclick="handleRestoreAdmin(${employee.id})">
                <span class="btn-icon">↩️</span> Geri Yükle
            </button>
            <button class="btn btn-danger btn-xs" onclick="handleHardDeleteAdmin(${employee.id})">
                <span class="btn-icon">🗑️</span> Kalıcı Sil
            </button>
        `;
    } else {
        const statusButton = employee.account_status === 'ACTIVE'
            ? `<button class="btn btn-warning btn-xs" onclick="handleSuspendAdmin(${employee.id})">
                   <span class="btn-icon">⏸️</span> Askıya Al
               </button>`
            : `<button class="btn btn-success btn-xs" onclick="handleActivateAdmin(${employee.id})">
                   <span class="btn-icon">▶️</span> Aktif Et
               </button>`;
        
        return `
            <button class="btn btn-primary btn-xs" onclick="handleEditAdminRole(${employee.id}, '${employee.full_name || employee.name}', '${employee.account_type}')">
                <span class="btn-icon">✏️</span> Rol Değiştir
            </button>
            ${statusButton}
            <button class="btn btn-danger btn-xs" onclick="handleSoftDeleteAdmin(${employee.id})">
                <span class="btn-icon">🗑️</span> Sil
            </button>
        `;
    }
}

// ===========================
// MODAL FONKSİYONLARI
// ===========================

function openEditCompanyNameModal() {
    if (!currentCompanyId) return;
    const company = companiesData.find(c => c.id === currentCompanyId);
    
    if (company) {
        document.getElementById('editCompanyName').value = company.company_name || '';
        document.getElementById('editCompanyNameModal').style.display = 'block';
    }
}

function closeEditCompanyNameModal() {
    document.getElementById('editCompanyNameModal').style.display = 'none';
}

function handleEditAdminRole(adminId, adminName, currentRole) {
    currentEditingAdmin = adminId;
    document.getElementById('editRoleAdminName').textContent = adminName;
    document.getElementById('editAdminRole').value = currentRole;
    document.getElementById('editAdminRoleModal').style.display = 'block';
}

function closeEditAdminRoleModal() {
    document.getElementById('editAdminRoleModal').style.display = 'none';
}

// ===========================
// ŞİRKET İŞLEMLERİ
// ===========================

async function handleEditCompanyName(e) {
    e.preventDefault();
    
    const formData = {
        company_name: document.getElementById('editCompanyName').value,
    };
    
    try {
        await updateCompany(currentCompanyId, formData);
        showToast('Şirket ismi başarıyla güncellendi', 'success');
        closeEditCompanyNameModal();
        await viewCompanyDetail(currentCompanyId);
        await loadCompanies();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleActivateCompanyDetail() {
    if (!currentCompanyId) return;
    if (!confirm('Şirketi aktif etmek istediğinizden emin misiniz?')) return;
    
    try {
        await updateCompanyStatus(currentCompanyId, 'ACTIVE');
        showToast('Şirket aktif edildi', 'success');
        await viewCompanyDetail(currentCompanyId);
        await loadCompanies();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSuspendCompanyDetail() {
    if (!currentCompanyId) return;
    if (!confirm('Şirketi askıya almak istediğinizden emin misiniz?')) return;
    
    try {
        await updateCompanyStatus(currentCompanyId, 'SUSPENDED');
        showToast('Şirket askıya alındı', 'success');
        await viewCompanyDetail(currentCompanyId);
        await loadCompanies();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSoftDeleteCompanyDetail() {
    if (!currentCompanyId) return;
    if (!confirm('Şirketi silmek istediğinizden emin misiniz? Bu işlem geri alınabilir.')) return;
    
    try {
        await softDeleteCompany(currentCompanyId);
        showToast('Şirket silindi', 'success');
        document.getElementById('companyDetailContent').classList.remove('active');
        document.getElementById('companiesContent').classList.add('active');
        await loadCompanies();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleRestoreCompany(companyId) {
    if (!confirm('Şirketi geri yüklemek istediğinizden emin misiniz?')) return;
    
    try {
        await restoreCompany(companyId);
        showToast('Şirket geri yüklendi', 'success');
        await loadCompanies();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleHardDeleteCompany(companyId) {
    if (!confirm('UYARI: Bu işlem geri alınamaz! Şirketi kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    
    try {
        await hardDeleteCompany(companyId);
        showToast('Şirket kalıcı olarak silindi', 'success');
        await loadCompanies();
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
        await loadCompanySites(currentCompanyId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSuspendSite(siteId) {
    if (!confirm('Site\'yi askıya almak istediğinizdan emin misiniz?')) return;
    
    try {
        await updateSiteStatus(siteId, 'SUSPENDED');
        showToast('Site askıya alındı', 'success');
        await loadCompanySites(currentCompanyId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSoftDeleteSite(siteId) {
    if (!confirm('Site\'yi silmek istediğinizden emin misiniz?')) return;
    
    try {
        await softDeleteSite(siteId);
        showToast('Site silindi', 'success');
        await loadCompanySites(currentCompanyId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleRestoreSite(siteId) {
    if (!confirm('Site\'yi geri yüklemek istediğinizden emin misiniz?')) return;
    
    try {
        await restoreSite(siteId);
        showToast('Site geri yüklendi', 'success');
        await loadCompanySites(currentCompanyId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleHardDeleteSite(siteId) {
    if (!confirm('UYARI: Bu işlem geri alınamaz! Site\'yi kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    
    try {
        await hardDeleteSite(siteId);
        showToast('Site kalıcı olarak silindi', 'success');
        await loadCompanySites(currentCompanyId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ===========================
// ÇALIŞAN İŞLEMLERİ
// ===========================

async function handleSaveAdminRoleChange(e) {
    e.preventDefault();
    const newRole = document.getElementById('editAdminRole').value;
    
    try {
        await updateAdminRole(currentEditingAdmin, newRole);
        showToast('Çalışan rolü güncellendi', 'success');
        closeEditAdminRoleModal();
        await loadCompanyEmployees(currentCompanyId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleActivateAdmin(adminId) {
    if (!confirm('Çalışanı aktif etmek istediğinizden emin misiniz?')) return;
    
    try {
        await updateAdminStatus(adminId, 'ACTIVE');
        showToast('Çalışan aktif edildi', 'success');
        await loadCompanyEmployees(currentCompanyId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSuspendAdmin(adminId) {
    if (!confirm('Çalışanı askıya almak istediğinizdan emin misiniz?')) return;
    
    try {
        await updateAdminStatus(adminId, 'SUSPENDED');
        showToast('Çalışan askıya alındı', 'success');
        await loadCompanyEmployees(currentCompanyId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSoftDeleteAdmin(adminId) {
    if (!confirm('Çalışanı silmek istediğinizden emin misiniz?')) return;
    
    try {
        await softDeleteAdmin(adminId);
        showToast('Çalışan silindi', 'success');
        await loadCompanyEmployees(currentCompanyId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleRestoreAdmin(adminId) {
    if (!confirm('Çalışanı geri yüklemek istediğinizden emin misiniz?')) return;
    
    try {
        await restoreAdmin(adminId);
        showToast('Çalışan geri yüklendi', 'success');
        await loadCompanyEmployees(currentCompanyId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleHardDeleteAdmin(adminId) {
    if (!confirm('UYARI: Bu işlem geri alınamaz! Çalışanı kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    
    try {
        await hardDeleteAdmin(adminId);
        showToast('Çalışan kalıcı olarak silindi', 'success');
        await loadCompanyEmployees(currentCompanyId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ===========================
// EVENT LISTENERS
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    loadCompanies();
    loadCompanyStats();

    // Filtreler
    document.getElementById('companySearch')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = companiesData.filter(c => 
            (c.company_name || '').toLowerCase().includes(query) ||
            (c.company_code || '').toLowerCase().includes(query)
        );
        displayCompanies(filtered);
    });

    document.getElementById('companyStatusFilter')?.addEventListener('change', loadCompanies);
    document.getElementById('showDeletedCompanies')?.addEventListener('change', loadCompanies);
    document.getElementById('showDeletedSites')?.addEventListener('change', () => {
        if (currentCompanyId) loadCompanySites(currentCompanyId);
    });
    document.getElementById('showDeletedEmployees')?.addEventListener('change', () => {
        if (currentCompanyId) loadCompanyEmployees(currentCompanyId);
    });

    // Geri butonu
    document.getElementById('backToCompanies')?.addEventListener('click', () => {
        document.getElementById('companyDetailContent').classList.remove('active');
        document.getElementById('companiesContent').classList.add('active');
        currentCompanyId = null;
    });

    // Şirket Detay Butonları
    document.getElementById('editCompanyNameBtn')?.addEventListener('click', openEditCompanyNameModal);
    document.getElementById('suspendCompanyBtn')?.addEventListener('click', handleSuspendCompanyDetail);
    document.getElementById('activateCompanyBtn')?.addEventListener('click', handleActivateCompanyDetail);
    document.getElementById('deleteCompanyBtn')?.addEventListener('click', handleSoftDeleteCompanyDetail);

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });

    // Edit Company Name Modal
    document.getElementById('closeEditCompanyNameModal')?.addEventListener('click', closeEditCompanyNameModal);
    document.getElementById('cancelEditCompanyName')?.addEventListener('click', closeEditCompanyNameModal);
    document.getElementById('editCompanyNameForm')?.addEventListener('submit', handleEditCompanyName);

    // Edit Admin Role Modal
    document.getElementById('closeEditRoleModal')?.addEventListener('click', closeEditAdminRoleModal);
    document.getElementById('cancelEditRole')?.addEventListener('click', closeEditAdminRoleModal);
    document.getElementById('editAdminRoleForm')?.addEventListener('submit', handleSaveAdminRoleChange);

    // Modal dışına tıklayınca kapatma
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
});

// Global fonksiyonlar
window.viewCompanyDetail = viewCompanyDetail;
window.handleRestoreCompany = handleRestoreCompany;
window.handleHardDeleteCompany = handleHardDeleteCompany;
window.handleActivateSite = handleActivateSite;
window.handleSuspendSite = handleSuspendSite;
window.handleSoftDeleteSite = handleSoftDeleteSite;
window.handleRestoreSite = handleRestoreSite;
window.handleHardDeleteSite = handleHardDeleteSite;
window.handleEditAdminRole = handleEditAdminRole;
window.handleActivateAdmin = handleActivateAdmin;
window.handleSuspendAdmin = handleSuspendAdmin;
window.handleSoftDeleteAdmin = handleSoftDeleteAdmin;
window.handleRestoreAdmin = handleRestoreAdmin;
window.handleHardDeleteAdmin = handleHardDeleteAdmin;