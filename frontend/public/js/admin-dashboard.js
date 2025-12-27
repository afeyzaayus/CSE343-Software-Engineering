const API_BASE_URL = 'http://localhost:3000/api';

// Token'ı localStorage'dan al
function getAuthToken() {
    return localStorage.getItem('adminToken');
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const token = getAuthToken();

    // Token ve user kontrolü
    if (!token || !userData) {
        console.error('❌ Token veya user data bulunamadı');
        localStorage.clear();
        window.location.href = '/index.html';
        return;
    }

    console.log('✅ Token bulundu:', token.substring(0, 20) + '...');
    console.log('✅ User data:', userData);

    // ✅ currentUser'ı hemen oluştur (site seçilmeden önce de kullanılabilsin)
    if (!localStorage.getItem('currentUser')) {
        localStorage.setItem('currentUser', JSON.stringify({
            user_id: userData.id || userData.user_id,
            full_name: userData.full_name || userData.name,
            account_type: userData.role || userData.account_type,
            email: userData.email || ''
        }));
        console.log('✅ currentUser localStorage\'a kaydedildi');
    }

    // UI'ı doldur
    setupUI(userData);

    // Siteleri yükle
    fetchSites();

    // Eğer COMPANY_MANAGER ise çalışan ve davet verilerini yükle
    const userRole = userData.role || userData.account_type || 'USER';
    if (userRole === 'COMPANY_MANAGER') {
        fetchEmployees();
        fetchInvitations();
    }
});
function setupUI(userData) {
    // Kullanıcı bilgileri
    const userName = userData.name || userData.full_name || 'Kullanıcı';
    const userRole = userData.role || userData.account_type || 'USER';
    const userEmail = userData.email || userData.user_email || userData.mail || '-';

    document.getElementById('userName').textContent = userName;
    document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();
    document.getElementById('userType').textContent = getRoleText(userRole);

    // Populate dropdown menu
    document.getElementById('dropdownEmail').textContent = userEmail;
    document.getElementById('dropdownName').textContent = userName;
    document.getElementById('dropdownAccountType').textContent = getRoleText(userRole);

    // Setup user section click event for dropdown
    const userSection = document.getElementById('userSection');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.querySelector('.logout-btn');

    if (userSection && userDropdown) {
        userSection.addEventListener('click', (e) => {
            // Don't toggle if clicking logout button
            if (e.target === logoutBtn || logoutBtn.contains(e.target)) {
                return;
            }
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
    }

    const companyCodeDisplay = document.getElementById('companyCodeDisplay');
    const companyCodeCard = document.getElementById('companyCodeCard');

    if (companyCodeDisplay) {
        companyCodeDisplay.textContent = userData.company_code || '-';

        // Kopyalama için tıklanabilir yap
        companyCodeDisplay.style.cursor = "pointer";
        companyCodeDisplay.title = "Kopyalamak için tıkla";
        companyCodeDisplay.onclick = function () {
            if (companyCodeDisplay.textContent && companyCodeDisplay.textContent !== '-' && companyCodeDisplay.textContent !== 'KOD YOK') {
                navigator.clipboard.writeText(companyCodeDisplay.textContent)
                    .then(() => showToast("📋 Şirket kodu kopyalandı: " + companyCodeDisplay.textContent, "success"))
                    .catch(() => showToast("Kopyalama başarısız!", "error"));
            } else {
                showToast("Kopyalanacak şirket kodu yok!", "error");
            }
        };

        // INDIVIDUAL ise şirket kodu kartını gizle
        if (userRole === 'INDIVIDUAL' && companyCodeCard) {
            companyCodeCard.style.display = 'none';
        }
    }

    // Stat card'ları kontrol et (Şirket kodu, Bekleyen Davetler, Çalışanlar)
    const pendingInvitesCard = document.getElementById('pendingInvitesCard');
    const employeesCountCard = document.getElementById('employeesCountCard');

    if (userRole === 'INDIVIDUAL') {
        // Bireysel hesaplarda tüm şirket stat card'larını gizle
        if (companyCodeCard) companyCodeCard.style.display = 'none';
        if (pendingInvitesCard) pendingInvitesCard.style.display = 'none';
        if (employeesCountCard) employeesCountCard.style.display = 'none';
    }

    // Tab navigasyonu ve görünürlük ayarları
    const tabNavigation = document.querySelector('.tab-navigation');
    const sitesTabBtn = document.querySelectorAll('.tab-btn')[0]; // Siteler tab
    const employeesTabBtn = document.querySelectorAll('.tab-btn')[1]; // Çalışanlar tab
    const complaintsTabBtn = document.querySelectorAll('.tab-btn')[2]; // Şikayetler tab

    const sitesTabContent = document.getElementById('sitesTab');
    const employeesTabContent = document.getElementById('employeesTab');
    const complaintsTabContent = document.getElementById('complaintsTab');

    if (userRole === 'INDIVIDUAL') {
        // Bireysel: Site + Şikayet tabı
        document.getElementById('siteLimit').textContent = '1';
        if (employeesTabBtn) employeesTabBtn.style.display = 'none';
        if (employeesTabContent) employeesTabContent.style.display = 'none';
        if (tabNavigation) tabNavigation.style.display = 'flex';

    } else if (userRole === 'COMPANY_MANAGER') {
        // Şirket Yöneticisi: Site + Çalışan + Şikayet tabı
        document.getElementById('siteLimit').textContent = '∞';
        if (tabNavigation) tabNavigation.style.display = 'flex';

    } else if (userRole === 'COMPANY_EMPLOYEE') {
        // Şirket Çalışanı: Sadece Site tabı
        document.getElementById('siteLimit').textContent = '∞';
        const createBtn = document.getElementById('createSiteBtn');
        if (createBtn) createBtn.style.display = 'none';
        if (employeesTabBtn) employeesTabBtn.style.display = 'none';
        if (complaintsTabBtn) complaintsTabBtn.style.display = 'none';
        if (employeesTabContent) employeesTabContent.style.display = 'none';
        if (complaintsTabContent) complaintsTabContent.style.display = 'none';
        if (tabNavigation) tabNavigation.style.display = 'flex';
    }

    console.log(`✅ UI kuruldu: ${userName} (${userRole})`);
}

// Role'ü Türkçe metne çevir
function getRoleText(role) {
    const roleMap = {
        'INDIVIDUAL': 'Bireysel Hesap',
        'COMPANY_MANAGER': 'Şirket Yöneticisi',
        'COMPANY_EMPLOYEE': 'Şirket Çalışanı'
    };
    return roleMap[role] || 'Kullanıcı';
}

// Site listesini getir
async function fetchSites() {
    try {
        const token = getAuthToken();

        if (!token) {
            throw new Error('Token bulunamadı. Lütfen tekrar giriş yapın.');
        }

        console.log('📤 Siteler getiriliyor...');

        const response = await fetch(`${API_BASE_URL}/sites`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        console.log('📥 Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();

            if (response.status === 401) {
                console.error('❌ Token geçersiz, login sayfasına yönlendiriliyor...');
                localStorage.clear();
                window.location.href = '/index.html';
                return;
            }

            throw new Error(errorData.error || errorData.message || 'Siteler alınamadı');
        }

        const data = await response.json();
        console.log('✅ API Response:', data);

        if (data.success && data.data && data.data.sites) {
            console.log(`✅ ${data.data.sites.length} site bulundu`);

            window.sites = data.data.sites;

            // İstatistikleri güncelle
            document.getElementById('totalSites').textContent = data.data.sites.length;

            // Listeyi render et
            renderSiteList(data.data.sites);
        } else {
            console.error('❌ Geçersiz veri formatı:', data);
            throw new Error('Geçersiz veri formatı');
        }

    } catch (err) {
        console.error('❌ Site listesi hatası:', err);
        showToast("Site listesi alınamadı: " + err.message, 'error');
        renderSiteList([]);
    }
}

// Site listesini render et
function renderSiteList(sites) {
    const list = document.getElementById('siteList');

    if (!list) {
        console.error('❌ siteList elementi bulunamadı!');
        return;
    }

    list.innerHTML = "";

    // Site yoksa
    if (!sites || sites.length === 0) {
        const userData = JSON.parse(localStorage.getItem('user'));
        const userRole = userData.role || userData.account_type;

        // COMPANY_EMPLOYEE için farklı mesaj
        const emptyMessage = userRole === 'COMPANY_EMPLOYEE'
            ? 'Şirketinizde henüz oluşturulmuş site bulunmuyor'
            : 'Yeni bir site oluşturarak başlayabilirsiniz';

        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏗️</div>
                <h3>Henüz Site Bulunmuyor</h3>
                <p>${emptyMessage}</p>
            </div>
        `;
        return;
    }

    console.log('🎨 Siteler render ediliyor...');

    const userData = JSON.parse(localStorage.getItem('user'));
    const userRole = userData.role || userData.account_type || 'USER';

    // Yetki kontrolü
    const canEdit = (userRole === 'COMPANY_MANAGER' || userRole === 'INDIVIDUAL');
    const canManage = true; // Herkes yönetebilir

    sites.forEach(site => {
        const card = document.createElement('div');
        card.classList.add('site-card');

        card.innerHTML = `
            <div class="site-card-header">
                <h3>🏢 ${site.site_name}</h3>
                <span class="site-badge ${site.site_status === 'ACTIVE' ? 'active' : 'inactive'}">
                    ${site.site_status === 'ACTIVE' ? 'AKTİF' : 'PASİF'}
                </span>
            </div>
            
            <p class="site-address">
                📍 ${site.site_address || 'Adres belirtilmemiş'}
            </p>
            
            <div style="background: #f8f9fa; padding: 12px; border-radius: 10px; margin-bottom: 15px;">
                <div style="font-size: 12px; color: #666;">
                    <strong>Site ID:</strong> 
                    <span style="font-family: 'Courier New', monospace; background: white; padding: 2px 8px; border-radius: 4px;">${site.site_id}</span>
                </div>
            </div>
            
            <div class="site-stats">
                <div class="site-stat">
                    <span>${site.block_count || 0}</span>
                    <small>Blok</small>
                </div>
                <div class="site-stat">
                    <span>${site.apartment_count || 0}</span>
                    <small>Daire/Blok</small>
                </div>
                <div class="site-stat">
                    <span>${(site.block_count || 0) * (site.apartment_count || 0)}</span>
                    <small>Toplam</small>
                </div>
            </div>
            
            ${site.admin ? `
                <div style="padding-top: 12px; border-top: 1px solid #eee; margin-top: 15px; font-size: 12px; color: #999;">
                    👤 Oluşturan: <strong style="color: #666;">${site.admin.full_name || site.admin.name || 'Bilinmeyen'}</strong>
                </div>
            ` : ''}
            
            ${site.companies ? `
                <div style="font-size: 12px; color: #999; margin-top: 5px;">
                    🏢 Şirket: <strong style="color: #666;">${site.companies.company_name}</strong>
                </div>
            ` : ''}
            
            ${canManage ? `
                <div class="site-actions">
                    <button onclick="selectSite('${site.site_id}', '${site.site_name.replace(/'/g, "\\'")}')" 
                            class="btn btn-manage">
                        🎯 Siteyi Yönet
                    </button>
                </div>
            ` : ''}
            
            ${canEdit ? `
                <div class="site-actions" style="margin-top: 8px;">
                    <button onclick="editSite('${site.site_id}')" 
                            class="btn btn-edit">
                        ✏️ Düzenle
                    </button>
                    <button onclick="deleteSiteConfirm('${site.site_id}', '${site.site_name.replace(/'/g, "\\'")}')" 
                            class="btn btn-delete">
                        🗑️ Sil
                    </button>
                </div>
            ` : ''}
        `;

        list.appendChild(card);
    });

    console.log('✅ Siteler başarıyla render edildi');
}

// Site seçme
function selectSite(siteId, siteName) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const token = getAuthToken(); // ✅ Token kontrolü ekledik

    if (!token || !currentUser) {
        showToast('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.', 'error');
        setTimeout(() => window.location.href = '/index.html', 1500);
        return;
    }

    // ✅ selectedSite'ı kaydet
    localStorage.setItem('selectedSite', JSON.stringify({
        site_id: siteId,
        site_name: siteName
    }));

    // ✅ currentUser'ı kaydet (eğer yoksa)
    if (!localStorage.getItem('currentUser')) {
        localStorage.setItem('currentUser', JSON.stringify({
            user_id: currentUser.id || currentUser.user_id,
            full_name: currentUser.full_name || currentUser.name,
            account_type: currentUser.role || currentUser.account_type,
            email: currentUser.email || ''
        }));
    }

    console.log(`✅ Site seçildi: ${siteName} (${siteId})`);
    console.log(`✅ Kullanıcı: ${currentUser.full_name || currentUser.name}`);
    console.log(`✅ Token mevcut: ${token.substring(0, 20)}...`);

    showToast(`✅ "${siteName}" seçildi! Dashboard'a yönlendiriliyorsunuz...`, 'success');

    setTimeout(() => {
        window.location.href = '/dashboard.html';
    }, 1000);
}

// Site oluşturma formu
document.getElementById("createSiteForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = getAuthToken(); // ✅ Token ekledik
    if (!token) {
        showToast("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.", "error");
        setTimeout(() => window.location.href = '/index.html', 1500);
        return;
    }

    const payload = {
        site_id: document.getElementById("siteId").value.trim(),        // ✅ siteId → site_id
        site_name: document.getElementById("siteName").value.trim(),    // ✅ siteName → site_name
        site_address: document.getElementById("siteAddress").value.trim() // ✅ siteAddress → site_address
        // ✅ blockCount ve apartmentCount kaldırıldı (backend'de otomatik)
    };

    // ✅ Validation ekledik
    if (!payload.site_id || !payload.site_name || !payload.site_address) {
        showToast("Lütfen tüm alanları doldurun!", "error");
        return;
    }

    console.log('📤 Site oluşturuluyor:', payload);

    try {
        const res = await fetch(`${API_BASE_URL}/sites`, { // ✅ /api/sites/create → /api/sites
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // ✅ Token header'ı ekledik
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log('📥 Response:', data);

        if (!res.ok) {
            throw new Error(data.error || data.message || "Site oluşturulamadı");
        }

        showToast("✅ Site başarıyla oluşturuldu!", "success");
        closeCreateModal();

        // ✅ fetchSites() kullan (loadSites yerine)
        setTimeout(() => fetchSites(), 500);

    } catch (err) {
        console.error('❌ Site oluşturma hatası:', err);
        showToast(err.message || "Sunucu hatası!", "error");
    }
});

function openEditModal(site) {
    const modal = document.getElementById("editModal");
    if (!modal) return console.error("❌ Edit modal bulunamadı");

    modal.style.display = "flex";
    document.getElementById("editSiteId").value = site.site_id || "";
    document.getElementById("editSiteName").value = site.name || "";
    document.getElementById("editSiteAddress").value = site.address || "";
}

// Edit modal kapatma
function closeEditModal() {
    const modal = document.getElementById("editModal");
    if (modal) modal.style.display = "none";
}
// Edit form submit
const editForm = document.getElementById("editSiteForm");
if (editForm) {
    editForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const token = getAuthToken(); // ✅ Token ekledik
        if (!token) {
            showToast("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.", "error");
            setTimeout(() => window.location.href = '/index.html', 1500);
            return;
        }

        const siteId = document.getElementById("editSiteId").value.trim();
        const siteName = document.getElementById("editSiteName").value.trim();
        const siteAddress = document.getElementById("editSiteAddress").value.trim();

        // ✅ Validation ekledik
        if (!siteId || !siteName || !siteAddress) {
            showToast("Lütfen tüm alanları doldurun!", "error");
            return;
        }

        const payload = {
            site_name: siteName,      // ✅ name → site_name
            site_address: siteAddress  // ✅ address → site_address
        };

        console.log('📤 Site güncelleniyor:', siteId, payload);

        try {
            // ✅ Endpoint düzeltildi: /api/sites/:siteId
            const res = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // ✅ Token header'ı ekledik
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            console.log('📥 Response:', data);

            if (!res.ok) {
                throw new Error(data.error || data.message || "Site güncellenemedi");
            }

            showToast("✅ Site başarıyla güncellendi!", "success");
            closeEditModal();

            // ✅ fetchSites() kullan (loadSites yerine)
            setTimeout(() => fetchSites(), 500);

        } catch (err) {
            console.error("❌ Site güncelleme hatası:", err);
            showToast(err.message || "Site güncellenirken hata oluştu!", "error");
        }
    });
} else {
    console.error("❌ Edit form bulunamadı");
}
// Edit butonu ile site aç
function editSite(siteId) {
    if (!window.sites || !Array.isArray(window.sites)) {
        showToast("Site listesi yüklenemedi. Sayfayı yenileyin.", "error");
        console.error("❌ window.sites tanımlı değil");
        return;
    }

    const site = window.sites.find(s => s.site_id === siteId);
    if (!site) {
        showToast("Site bilgisi bulunamadı!", "error");
        console.error("❌ Site bulunamadı:", siteId);
        return;
    }

    openEditModal(site);
}

// Site silme onayı
function deleteSiteConfirm(siteId, siteName) {
    if (confirm(`"${siteName}" sitesini silmek istediğinizden emin misiniz?\n\n⚠️ ite ve bağlı tüm bloklar silinecek.`)) {
        deleteSite(siteId);
    }
}

// Site silme
async function deleteSite(siteId) {
    const token = getAuthToken();

    if (!token) {
        showToast("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.", "error");
        setTimeout(() => window.location.href = '/index.html', 1500);
        return;
    }

    console.log('🗑️ Site siliniyor:', siteId);

    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        console.log('📥 Response:', data);

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Site silinemedi');
        }

        showToast("✅ Site ve bağlı bloklar başarıyla silindi!", "success");

        setTimeout(() => fetchSites(), 500);

    } catch (err) {
        console.error('❌ Site silme hatası:', err);
        showToast(err.message, "error");
    }
}

// Modal
function openCreateModal() {
    const userData = JSON.parse(localStorage.getItem('user'));
    const userRole = userData.role || userData.account_type;

    // BİREYSEL HESAP LİMİT KONTROLÜ
    if (userRole === 'INDIVIDUAL') {
        const totalSites = parseInt(document.getElementById('totalSites').textContent) || 0;

        if (totalSites >= 1) {
            showToast("❌ Bireysel hesaplar maksimum 1 site oluşturabilir!", "error");
            return;
        }
    }

    const modal = document.getElementById('createModal');
    const siteIdInput = document.getElementById('siteId');

    if (modal) {
        if (siteIdInput) siteIdInput.value = generateSiteId();
        modal.classList.add('active');
    }
}

function closeCreateModal() {
    const modal = document.getElementById('createModal');
    const form = document.getElementById('createSiteForm');

    if (modal) modal.classList.remove('active');
    if (form) form.reset();
}

// Random Site ID
function generateSiteId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Tab değiştirme
function switchTab(tab) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    if (tab === 'sites') {
        tabBtns[0].classList.add('active');
        document.getElementById('sitesTab').classList.add('active');
    } else {
        tabBtns[1].classList.add('active');
        document.getElementById('employeesTab').classList.add('active');
    }
}

// Şirket kodu kopyalama
function copyCompanyCode() {
    const codeEl = document.getElementById('companyCode');
    const code = codeEl ? codeEl.textContent : '';

    if (code && code !== 'KOD YOK' && code !== '-') {
        navigator.clipboard.writeText(code)
            .then(() => showToast("📋 Şirket kodu kopyalandı: " + code, "success"))
            .catch(() => showToast("Kopyalama başarısız!", "error"));
    } else {
        showToast("Kopyalanacak şirket kodu yok!", "error");
    }
}

// Toast
function showToast(message, type = "success") {
    const toast = document.getElementById('toast');

    if (!toast) {
        alert(message);
        return;
    }

    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');

    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        console.log('👋 Çıkış yapılıyor...');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedSite');
        window.location.href = 'index.html';
    }
}

// Token kontrolü
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        const token = getAuthToken();
        if (!token) {
            localStorage.clear();
            window.location.href = '/index.html';
        }
    }
});

// Modal dışına tıklayınca kapat
document.addEventListener('click', (e) => {
    const modal = document.getElementById('createModal');
    if (modal && e.target === modal) {
        closeCreateModal();
    }

    const inviteModal = document.getElementById('inviteModal');
    if (inviteModal && e.target === inviteModal) {
        closeInviteModal();
    }

    // Close user dropdown when clicking outside
    const userDropdown = document.getElementById('userDropdown');
    const userSection = document.getElementById('userSection');
    if (userDropdown && !userSection.contains(e.target)) {
        userDropdown.classList.remove('active');
    }
});

// ==================== USER ACCOUNT DROPDOWN & PASSWORD CHANGE ====================

// Open password change modal
function openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.classList.add('active');
        // Close dropdown when opening modal
        const userDropdown = document.getElementById('userDropdown');
        if (userDropdown) {
            userDropdown.classList.remove('active');
        }
    }
}

// Close password change modal
function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    const form = document.getElementById('changePasswordForm');

    if (modal) modal.classList.remove('active');
    if (form) form.reset();
}

// Password change form submission
const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value.trim();
        const newPassword = document.getElementById('newPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Lütfen tüm alanları doldurun!', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Yeni şifre en az 6 karakter olmalıdır!', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Yeni şifreler eşleşmiyor!', 'error');
            return;
        }

        const token = getAuthToken();
        if (!token) {
            showToast('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.', 'error');
            setTimeout(() => window.location.href = '/index.html', 1500);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/admin/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Şifre değiştirilemedi');
            }

            showToast('✅ Şifreniz başarıyla güncellendi!', 'success');
            closeChangePasswordModal();

        } catch (err) {
            console.error('❌ Şifre değiştirme hatası:', err);
            showToast(err.message || 'Şifre değiştirilirken hata oluştu!', 'error');
        }
    });
}


// ==================== ÇALIŞAN YÖNETİMİ ====================

// Çalışanları getir
async function fetchEmployees() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/company/employees`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Çalışanlar alınamadı');
        }

        const data = await response.json();
        console.log('✅ Çalışanlar:', data);

        if (data.success && data.data && data.data.employees) {
            document.getElementById('totalEmployees').textContent = data.data.employees.length;
            renderEmployeeList(data.data.employees);
        }
    } catch (err) {
        console.error('❌ Çalışan listesi hatası:', err);
        showToast(err.message, 'error');
    }
}

// Çalışan listesini render et - Askıya alma ve silme ile
function renderEmployeeList(employees) {
    const list = document.getElementById('employeeList');

    if (!list) return;

    list.innerHTML = '';

    if (!employees || employees.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>Henüz Çalışan Yok</h3>
                <p>Yeni çalışan davet ederek başlayabilirsiniz</p>
            </div>
        `;
        return;
    }

    // ✅ Soft delete edilmiş çalışanları filtrele (ekstra güvenlik)
    const activeEmployees = employees.filter(emp => emp.status !== 'DELETED');

    if (activeEmployees.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>Henüz Çalışan Yok</h3>
                <p>Yeni çalışan davet ederek başlayabilirsiniz</p>
            </div>
        `;
        return;
    }

    activeEmployees.forEach(emp => {
        const card = document.createElement('div');
        card.classList.add('site-card');

        // Status badge'i belirle
        let statusBadgeClass = 'inactive';
        let statusText = 'PASİF';

        if (emp.status === 'ACTIVE') {
            statusBadgeClass = 'active';
            statusText = 'AKTİF';
        } else if (emp.status === 'SUSPENDED') {
            statusBadgeClass = 'suspended';
            statusText = '⏸️ ASKIDA';
        } else if (emp.status === 'DELETED') {
            statusBadgeClass = 'inactive';
            statusText = '🗑️ SİLİNDİ';
        }

        // Atanmış siteleri göster
        let sitesHTML = '';
        if (emp.assigned_sites && emp.assigned_sites.length > 0) {
            sitesHTML = `
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px; margin-bottom: 5px;">
                        🏗️ Atanmış Siteler:
                    </p>
                    ${emp.assigned_sites.map(site => `
                        <span class="site-badge" style="margin-right: 5px; font-size: 11px;">
                            ${site.site_name}
                        </span>
                    `).join('')}
                </div>
            `;
        }

        // Aksiyon butonları (sadece silinmemiş çalışanlar için)
        let actionsHTML = '';
        if (emp.status !== 'DELETED') {
            actionsHTML = `
                <div class="site-actions" style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                    ${emp.status === 'ACTIVE' ? `
                        <button onclick="suspendEmployeeConfirm(${emp.id}, '${emp.full_name.replace(/'/g, "\\'")}')" 
                                class="btn btn-secondary" style="flex: 1; min-width: 120px;">
                            ⏸️ Askıya Al
                        </button>
                    ` : ''}
                    ${emp.status === 'SUSPENDED' ? `
                        <button onclick="activateEmployeeConfirm(${emp.id}, '${emp.full_name.replace(/'/g, "\\'")}')" 
                                class="btn btn-primary" style="flex: 1; min-width: 120px;">
                            ✅ Aktif Et
                        </button>
                    ` : ''}
                    <button onclick="deleteEmployeeConfirm(${emp.id}, '${emp.full_name.replace(/'/g, "\\'")}')" 
                            class="btn btn-delete" style="flex: 1; min-width: 120px;">
                        🗑️ Sil
                    </button>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="site-card-header">
                <h3>👤 ${emp.full_name || 'İsimsiz Çalışan'}</h3>
                <span class="site-badge ${statusBadgeClass}">
                    ${statusText}
                </span>
            </div>
            <p style="color: #666; margin: 10px 0;">
                📧 ${emp.email}
            </p>
            <p style="color: #999; font-size: 12px;">
                📅 Katılma: ${emp.joined_at ? new Date(emp.joined_at).toLocaleDateString('tr-TR') : 'Belirsiz'}
            </p>
            ${emp.last_login ? `
                <p style="color: #999; font-size: 12px;">
                    🕐 Son Giriş: ${new Date(emp.last_login).toLocaleDateString('tr-TR')}
                </p>
            ` : ''}
            ${sitesHTML}
            ${actionsHTML}
        `;
        list.appendChild(card);
    });
}

// ==================== Çalışan Yönetimi Fonksiyonları ====================

/**
 * Çalışanı askıya alma onayı
 */
function suspendEmployeeConfirm(employeeId, employeeName) {
    if (confirm(`"${employeeName}" adlı çalışanı askıya almak istediğinize emin misiniz?\n\n⚠️ Askıya alınan çalışan sisteme giriş yapamaz.`)) {
        suspendEmployee(employeeId);
    }
}

/**
 * Çalışanı askıya al
 */
async function suspendEmployee(employeeId) {
    const token = getAuthToken();

    if (!token) {
        showToast('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.', 'error');
        setTimeout(() => window.location.href = '/index.html', 1500);
        return;
    }

    console.log('⏸️ Çalışan askıya alınıyor:', employeeId);

    try {
        const response = await fetch(`${API_BASE_URL}/company/employees/${employeeId}/suspend`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('📥 Response:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Çalışan askıya alınamadı');
        }

        showToast('✅ Çalışan başarıyla askıya alındı!', 'success');

        setTimeout(() => {
            fetchEmployees();
        }, 500);

    } catch (err) {
        console.error('❌ Çalışan askıya alma hatası:', err);
        showToast('❌ ' + err.message, 'error');
    }
}

/**
 * Çalışanı aktif etme onayı
 */
function activateEmployeeConfirm(employeeId, employeeName) {
    if (confirm(`"${employeeName}" adlı çalışanı aktif etmek istediğinize emin misiniz?`)) {
        activateEmployee(employeeId);
    }
}

/**
 * Çalışanı aktif et
 */
async function activateEmployee(employeeId) {
    const token = getAuthToken();

    if (!token) {
        showToast('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.', 'error');
        setTimeout(() => window.location.href = '/index.html', 1500);
        return;
    }

    console.log('✅ Çalışan aktif ediliyor:', employeeId);

    try {
        const response = await fetch(`${API_BASE_URL}/company/employees/${employeeId}/activate`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('📥 Response:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Çalışan aktif edilemedi');
        }

        showToast('✅ Çalışan başarıyla aktif edildi!', 'success');

        setTimeout(() => {
            fetchEmployees();
        }, 500);

    } catch (err) {
        console.error('❌ Çalışan aktif etme hatası:', err);
        showToast('❌ ' + err.message, 'error');
    }
}

/**
 * Çalışanı silme onayı
 */
function deleteEmployeeConfirm(employeeId, employeeName) {
    if (confirm(`"${employeeName}" adlı çalışanı silmek istediğinize emin misiniz?\n\n⚠️ Çalışan tüm site erişimlerini kaybedecek.`)) {
        deleteEmployee(employeeId);
    }
}

/**
 * Çalışanı sil
 */
async function deleteEmployee(employeeId) {
    const token = getAuthToken();

    if (!token) {
        showToast('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.', 'error');
        setTimeout(() => window.location.href = '/index.html', 1500);
        return;
    }

    console.log('🗑️ Çalışan siliniyor:', employeeId);

    try {
        const response = await fetch(`${API_BASE_URL}/company/employees/${employeeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('📥 Response:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Çalışan silinemedi');
        }

        showToast('✅ Çalışan başarıyla silindi!', 'success');

        setTimeout(() => {
            fetchEmployees();
        }, 500);

    } catch (err) {
        console.error('❌ Çalışan silme hatası:', err);
        showToast('❌ ' + err.message, 'error');
    }
}

// Davetleri getir
async function fetchInvitations() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/company/invitations`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Davetler alınamadı');
        }

        const data = await response.json();
        console.log('✅ Davetler:', data);

        if (data.success && data.data && data.data.invitations) {
            const pending = data.data.invitations.filter(inv => inv.status === 'PENDING');
            document.getElementById('pendingInvites').textContent = pending.length;
            renderInvitationList(data.data.invitations);
        }
    } catch (err) {
        console.error('❌ Davet listesi hatası:', err);
        showToast(err.message, 'error');
    }
}

// Davet listesini render et
function renderInvitationList(invitations) {
    const list = document.getElementById('invitationList');

    if (!list) return;

    list.innerHTML = '';

    if (!invitations || invitations.length === 0) {
        list.innerHTML = '<p style="color: #999;">Henüz davet gönderilmemiş</p>';
        return;
    }

    invitations.forEach(inv => {
        const card = document.createElement('div');
        card.classList.add('invitation-card');

        const statusText = {
            'PENDING': '⏳ Bekliyor',
            'ACCEPTED': '✅ Kabul Edildi',
            'EXPIRED': '❌ Süresi Doldu',
            'REJECTED': '🚫 Reddedildi'
        }[inv.status] || inv.status;

        const isExpired = inv.expires_at && new Date(inv.expires_at) < new Date();
        const isPending = inv.status === 'PENDING' && !isExpired;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <div style="flex: 1;">
                    <strong style="color: #333;">
                        ${inv.invited_email || 'Email belirtilmemiş'}
                    </strong>
                    <p style="color: #999; font-size: 12px; margin: 5px 0;">
                        Kod: <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">${inv.invite_code}</code>
                    </p>
                    <p style="color: #999; font-size: 12px;">
                        ${inv.expires_at
                ? (isExpired ? '❌ Süresi doldu' : '⏰ Bitiş: ' + new Date(inv.expires_at).toLocaleDateString('tr-TR'))
                : '⏰ Süresiz'
            }
                    </p>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                    <span class="site-badge ${inv.status === 'ACCEPTED' ? 'active' : inv.status === 'PENDING' ? '' : 'inactive'}">
                        ${statusText}
                    </span>
                    ${isPending ? `
                        <button onclick="deleteInvitation(${inv.id}, '${inv.invited_email || 'Bu davet'}')" 
                                class="btn-delete-invite"
                                title="Daveti Sil">
                            🗑️ Sil
                        </button>
                    ` : ''}
                </div>
            </div>
            ${isPending && inv.invite_link ? `
                <button onclick="copyInviteLink('${inv.invite_link}')" 
                        class="btn btn-primary" style="margin-top: 5px; width: 100%;">
                    📋 Davet Linkini Kopyala
                </button>
            ` : ''}
        `;
        list.appendChild(card);
    });
}

// ✅ Daveti sil
// ✅ Daveti sil - TAM DÜZELTİLMİŞ VERSİYON
async function deleteInvitation(invitationId, invitedEmail) {
    // Onay iste
    if (!confirm(`"${invitedEmail}" için gönderilen daveti silmek istediğinize emin misiniz?`)) {
        return;
    }

    try {
        const token = getAuthToken();

        if (!token) {
            showToast('❌ Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.', 'error');
            setTimeout(() => window.location.href = '/index.html', 1500);
            return;
        }

        console.log('🗑️ Davet siliniyor - ID:', invitationId);

        // ✅ DOĞRU ENDPOINT: /api/company/invitations/:id
        const response = await fetch(`${API_BASE_URL}/company/invitations/${invitationId}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        // Response'u kontrol et
        console.log('📥 Response status:', response.status);

        const data = await response.json();
        console.log('📥 Response data:', data);

        if (!response.ok) {
            // Özel hata durumları
            if (response.status === 404) {
                throw new Error('Davet bulunamadı veya zaten silinmiş');
            }
            if (response.status === 403) {
                throw new Error('Bu daveti silme yetkiniz yok');
            }
            if (response.status === 401) {
                throw new Error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
            }

            throw new Error(data.error || data.message || 'Davet silinemedi');
        }

        // Başarılı silme
        if (data.success) {
            showToast('✅ Davet başarıyla silindi!', 'success');

            // Listeyi yenile
            setTimeout(() => {
                fetchInvitations();
            }, 500);
        } else {
            throw new Error(data.error || data.message || 'Davet silinemedi');
        }

    } catch (err) {
        console.error('❌ Davet silme hatası:', err);
        showToast('❌ ' + err.message, 'error');

        // 401 hatası varsa login'e yönlendir
        if (err.message.includes('Oturum')) {
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/index.html';
            }, 2000);
        }
    }
}

// ========== ADMIN-DASHBOARD.JS İÇİNE EKLENECEK GÜNCEL VERSİYON ==========
// Yukarıdaki fonksiyonu admin-dashboard.js dosyanızdaki mevcut deleteInvitation 
// fonksiyonunun yerine koyun (satır 741 civarı)

// Davet modalı aç/kapat
function openInviteModal() {
    const modal = document.getElementById('inviteModal');
    if (modal) modal.classList.add('active');
}

function closeInviteModal() {
    const modal = document.getElementById('inviteModal');
    const form = document.getElementById('inviteEmployeeForm');
    if (modal) modal.classList.remove('active');
    if (form) form.reset();
}

// Davet gönder
const inviteForm = document.getElementById('inviteEmployeeForm');
if (inviteForm) {
    inviteForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const token = getAuthToken();
        const email = document.getElementById('employeeEmail').value.trim();

        if (!email) {
            showToast('Lütfen email adresi girin!', 'error');
            return;
        }

        // Email formatı kontrolü
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Geçerli bir email adresi girin!', 'error');
            return;
        }

        console.log('📤 Davet gönderiliyor:', email);

        try {
            const response = await fetch(`${API_BASE_URL}/company/invitations/create`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ invited_email: email })
            });

            const data = await response.json();
            console.log('📥 Response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Davet gönderilemedi');
            }

            if (data.success) {
                showToast(`✅ ${email} adresine davet gönderildi!`, 'success');
                closeInviteModal();

                // Listeleri yenile
                setTimeout(() => {
                    fetchInvitations();
                    fetchEmployees();
                }, 500);
            } else {
                throw new Error(data.error || 'Davet oluşturulamadı');
            }

        } catch (err) {
            console.error('❌ Davet gönderme hatası:', err);
            showToast(err.message, 'error');
        }
    });
}

// Davet linkini kopyala
function copyInviteLink(link) {
    if (!link) {
        showToast('Davet linki bulunamadı!', 'error');
        return;
    }

    navigator.clipboard.writeText(link)
        .then(() => showToast('📋 Davet linki kopyalandı!', 'success'))
        .catch((err) => {
            console.error('Kopyalama hatası:', err);
            showToast('Kopyalama başarısız!', 'error');
        });
}

// Şikayetleri getir
async function fetchComplaints() {
    try {
        const token = getAuthToken();
        const userData = JSON.parse(localStorage.getItem('user'));
        const adminId = userData?.id || userData?.adminId;
        // adminId'yi query parametresi olarak ekle
        const response = await fetch(`${API_BASE_URL}/admin/complaints?adminId=${adminId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Şikayetler alınamadı');
        }

        const data = await response.json();
        if (Array.isArray(data)) {
            renderComplaintList(data);
        } else if (data.success && data.data && Array.isArray(data.data.complaints)) {
            renderComplaintList(data.data.complaints);
        } else {
            renderComplaintList([]);
        }
    } catch (err) {
        console.error('❌ Şikayet listesi hatası:', err);
        showToast(err.message, 'error');
        renderComplaintList([]);
    }
}
function getCategoryText(category) {
    switch (category) {
        case 'TECHNICAL_SUPPORT': return 'Teknik Destek';
        case 'RESTORE': return 'Geri Yükleme';
        case 'REQUEST': return 'Talep';
        case 'FEATURE_REQUEST': return 'Yeni Özellik';
        case 'GENERAL': return 'Genel';
        case 'OTHER': return 'Diğer';
        default: return category || '';
    }
}
// Şikayet listesini render et (master_note ile)
function renderComplaintList(complaints) {
    const list = document.getElementById('complaintList');
    if (!list) return;

    list.innerHTML = '';

    if (!complaints || complaints.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>Henüz Şikayet Yok</h3>
                <p>Yeni bir şikayet oluşturarak başlayabilirsiniz.</p>
            </div>
        `;
        return;
    }

    complaints.forEach(complaint => {
        const item = document.createElement('div');
        item.className = 'complaint-card';

        let statusClass = 'badge-pending';
        let statusText = 'Bekliyor';
        if (complaint.status === 'RESOLVED') {
            statusClass = 'badge-resolved';
            statusText = 'Çözüldü';
        } else if (complaint.status === 'REJECTED') {
            statusClass = 'badge-rejected';
            statusText = 'Reddedildi';
        } else if (complaint.status === 'IN_PROGRESS') {
            statusClass = 'badge-in_progress';
            statusText = 'İşlemde';
        }

        // Master note'u göster (sadece IN_PROGRESS veya RESOLVED durumunda)
        let masterNoteHtml = '';
        if (complaint.master_note && (complaint.status === 'IN_PROGRESS' || complaint.status === 'RESOLVED')) {
            masterNoteHtml = `
                <div class="complaint-master-note">
                    <span class="master-note-label">Yönetici Yanıtı</span>
                    <p class="master-note-text">${complaint.master_note}</p>
                </div>
            `;
        }

        item.innerHTML = `
            <div class="complaint-header">
                <span class="complaint-title">${complaint.title}</span>
                <span class="site-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="complaint-content">${complaint.content}</div>
            ${masterNoteHtml}
            <div class="complaint-meta">
                <span>${getCategoryText(complaint.category)}</span>
                <span class="complaint-date">${complaint.created_at ? new Date(complaint.created_at).toLocaleDateString('tr-TR') : ''}</span>
            </div>
            <div class="complaint-actions">
                <button class="btn btn-edit-complaint" onclick="editComplaint(${complaint.id})">Düzenle</button>
                <button class="btn btn-delete-complaint" onclick="deleteComplaintConfirm(${complaint.id})">Sil</button>
            </div>
        `;
        list.appendChild(item);
    });
}

// Şikayet oluşturma modalı aç
function openCreateComplaintModal() {
    document.getElementById('createComplaintModal').style.display = 'flex';
    document.getElementById('createComplaintForm').reset();
}
// Şikayet oluşturma modalı kapat
function closeCreateComplaintModal() {
    document.getElementById('createComplaintModal').style.display = 'none';
}

// Şikayet düzenleme modalı aç
function openEditComplaintModal() {
    document.getElementById('editComplaintModal').style.display = 'flex';
}

// Şikayet düzenleme modalı kapat
function closeEditComplaintModal() {
    document.getElementById('editComplaintModal').style.display = 'none';
}

// Şikayet düzenle modalını doldur
function editComplaint(id) {
    fetch(`${API_BASE_URL}/admin/complaints/${id}`, {
        headers: { "Authorization": `Bearer ${getAuthToken()}` }
    })
        .then(res => res.json())
        .then(data => {
            const c = data.complaint;
            if (c && c.id) {
                document.getElementById('editComplaintId').value = c.id;
                document.getElementById('editComplaintTitle').value = c.title;
                document.getElementById('editComplaintContent').value = c.content;
                document.getElementById('editComplaintCategory').value = c.category;
                openEditComplaintModal();
            } else {
                showToast("Şikayet bulunamadı!", "error");
            }
        });
}

// Şikayet oluşturma submit
document.getElementById('createComplaintForm').onsubmit = async function (e) {
    e.preventDefault();
    const title = document.getElementById('createComplaintTitle').value.trim();
    const content = document.getElementById('createComplaintContent').value.trim();
    const category = document.getElementById('createComplaintCategory').value;

    const userData = JSON.parse(localStorage.getItem('user'));
    const adminId = userData?.id || userData?.adminId;
    const accountType = userData?.role || userData?.account_type;

    if (!title || !content || !category) {
        showToast("Lütfen tüm alanları doldurun!", "error");
        return;
    }

    const payload = { title, content, category, adminId, accountType };
    const token = getAuthToken();

    try {
        const res = await fetch(`${API_BASE_URL}/admin/complaints`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "İşlem başarısız");
        closeCreateComplaintModal();
        showToast("Şikayetiniz iletildi.", "success");
        fetchComplaints();
    } catch (err) {
        showToast(err.message, "error");
    }
};

// Şikayet düzenleme submit
document.getElementById('editComplaintForm').onsubmit = async function (e) {
    e.preventDefault();
    const id = document.getElementById('editComplaintId').value;
    const title = document.getElementById('editComplaintTitle').value.trim();
    const content = document.getElementById('editComplaintContent').value.trim();
    const category = document.getElementById('editComplaintCategory').value;

    const userData = JSON.parse(localStorage.getItem('user'));
    const adminId = userData?.id || userData?.adminId;
    const accountType = userData?.role || userData?.account_type;

    if (!title || !content || !category) {
        showToast("Lütfen tüm alanları doldurun!", "error");
        return;
    }

    const payload = { title, content, category, adminId, accountType };
    const token = getAuthToken();

    try {
        const res = await fetch(`${API_BASE_URL}/admin/complaints/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "İşlem başarısız");
        closeEditComplaintModal();
        showToast("Şikayet güncellendi!", "success");
        fetchComplaints();
    } catch (err) {
        showToast(err.message, "error");
    }
};

// Şikayet silme onayı
function deleteComplaintConfirm(id) {
    if (confirm("Bu şikayeti silmek istediğinize emin misiniz?")) {
        deleteComplaint(id);
    }
}

// Şikayet sil
async function deleteComplaint(id) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/admin/complaints/${id}`, {
            method: 'DELETE',
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Şikayet silinemedi");
        showToast("Şikayet silindi!", "success");
        fetchComplaints();
    } catch (err) {
        showToast(err.message, "error");
    }
}

// Şikayet oluştur/düzenle submit
document.getElementById('complaintForm').onsubmit = async function (e) {
    e.preventDefault();
    const id = document.getElementById('complaintId').value;
    const title = document.getElementById('complaintTitle').value.trim();
    const content = document.getElementById('complaintContent').value.trim();
    const category = document.getElementById('complaintCategory').value;

    // KULLANICI BİLGİLERİNİ AL
    const userData = JSON.parse(localStorage.getItem('user'));
    const adminId = userData?.id || userData?.adminId;
    const accountType = userData?.role || userData?.account_type;

    if (!title || !content || !category) {
        showToast("Lütfen tüm alanları doldurun!", "error");
        return;
    }

    // GÜNCEL PAYLOAD
    const payload = { title, content, category, adminId, accountType };

    const token = getAuthToken();

    try {
        let url = `${API_BASE_URL}/admin/complaints`;
        let method = "POST";
        if (id) {
            url += `/${id}`;
            method = "PUT";
        }
        const res = await fetch(url, {
            method,
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "İşlem başarısız");
        closeComplaintModal();
        showToast(id ? "Şikayet güncellendi!" : "Şikayetiniz iletildi.", "success");
        fetchComplaints();
        // Modal başlığını ve butonunu sıfırla
        document.getElementById('complaintModalTitle').textContent = "📝 Yeni Şikayet Oluştur";
        document.getElementById('complaintSubmitText').textContent = "📤 Gönder";
        document.getElementById('complaintForm').reset();
        document.getElementById('complaintId').value = "";
    } catch (err) {
        showToast(err.message, "error");
    }
};

// Şikayet modalı açıldığında formu sıfırla
function openComplaintModal() {
    document.getElementById('createComplaintModal').style.display = 'flex';
    document.getElementById('createComplaintForm').reset();
}
function closeComplaintModal() {
    document.getElementById('createComplaintModal').style.display = 'none';
}
// Tab değiştirme fonksiyonunu güncelle
function switchTab(tab) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    if (tab === 'sites') {
        tabBtns[0].classList.add('active');
        document.getElementById('sitesTab').classList.add('active');
    } else if (tab === 'employees') {
        tabBtns[1].classList.add('active');
        document.getElementById('employeesTab').classList.add('active');
    } else if (tab === 'complaints') {
        tabBtns[2].classList.add('active');
        document.getElementById('complaintsTab').classList.add('active');
        fetchComplaints();
    }
}

// Sayfa yüklendiğinde şikayet tabı varsa şikayetleri getir
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('complaintList')) {
        fetchComplaints();
    }
});