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
        window.location.href = '/login.html';
        return;
    }

    console.log('✅ Token bulundu:', token.substring(0, 20) + '...');
    console.log('✅ User data:', userData);

    // UI'ı doldur
    setupUI(userData);

    // Siteleri yükle
    fetchSites();
});

// UI'ı doldur
function setupUI(userData) {
    // Kullanıcı bilgileri
    const userName = userData.name || userData.full_name || 'Kullanıcı';
    const userRole = userData.role || 'USER';
    
    document.getElementById('userName').textContent = userName;
    document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();
    document.getElementById('userType').textContent = getRoleText(userRole);
    
    // Şirket bilgileri (varsa)
    if (userData.company_name) {
        // Header'daki şirket adı alanı yoksa eklemeyelim, sadece varsa dolduralım
        const companyEl = document.getElementById('userCompany');
        if (companyEl) companyEl.textContent = userData.company_name;
    }
    
    // Şirket kodu banner'ı
    const companyCodeBanner = document.getElementById('companyCodeBanner');
    const companyCodeEl = document.getElementById('companyCode');
    const companyCodeDesc = document.getElementById('companyCodeDesc');
    
    if (userRole === 'INDIVIDUAL') {
        // Bireysel hesap - şirket kodu yok
        companyCodeBanner.style.display = 'none';
        document.getElementById('siteLimit').textContent = '1';
        
        // Çalışanlar tabını gizle
        const employeesTab = document.querySelectorAll('.tab-btn')[1];
        if (employeesTab) employeesTab.style.display = 'none';
    } else if (userRole === 'COMPANY_MANAGER') {
        // Şirket yöneticisi - şirket kodunu göster
        companyCodeBanner.style.display = 'block';
        companyCodeEl.textContent = userData.company_code || 'KOD YOK';
        companyCodeDesc.textContent = 'Bu kodu çalışanlarınızla paylaşarak onları sisteme davet edebilirsiniz';
        document.getElementById('siteLimit').textContent = '∞';
    } else if (userRole === 'COMPANY_EMPLOYEE') {
        // Çalışan - şirket kodunu göster ama oluşturma butonu gizli
        companyCodeBanner.style.display = 'block';
        companyCodeEl.textContent = userData.company_code || 'KOD YOK';
        companyCodeDesc.textContent = 'Şirket kodunuz (Sadece görüntüleme)';
        document.getElementById('siteLimit').textContent = '∞';
        document.getElementById('createSiteBtn').style.display = 'none';
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
                window.location.href = '/login.html';
                return;
            }
            
            throw new Error(errorData.error || errorData.message || 'Siteler alınamadı');
        }

        const data = await response.json();
        console.log('✅ API Response:', data);

        if (data.success && data.data && data.data.sites) {
            console.log(`✅ ${data.data.sites.length} site bulundu`);
            
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
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏗️</div>
                <h3>Henüz Site Bulunmuyor</h3>
                <p>Yeni bir site oluşturarak başlayabilirsiniz</p>
            </div>
        `;
        return;
    }

    console.log('🎨 Siteler render ediliyor...');

    const userData = JSON.parse(localStorage.getItem('user'));
    const userRole = userData.role || 'USER';
    
    // Yetki kontrolü
    const canEdit = (userRole === 'COMPANY_MANAGER' || userRole === 'INDIVIDUAL');

    sites.forEach(site => {
        const card = document.createElement('div');
        card.classList.add('site-card');

        card.innerHTML = `
            <div class="site-card-header">
                <h3>🏢 ${site.site_name}</h3>
                <span class="site-badge">${site.site_status === 'ACTIVE' ? 'AKTİF' : 'PASİF'}</span>
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
                    👤 Oluşturan: <strong style="color: #666;">${site.admin.name || site.admin.full_name || 'Bilinmeyen'}</strong>
                </div>
            ` : ''}
            
            <div class="site-actions">
                <button onclick="selectSite('${site.site_id}', '${site.site_name}')" 
                        class="btn btn-manage">
                    🎯 Siteyi Yönet
                </button>
            </div>
            
            ${canEdit ? `
                <div class="site-actions" style="margin-top: 8px;">
                    <button onclick="editSite('${site.site_id}')" 
                            class="btn btn-edit">
                        ✏️ Düzenle
                    </button>
                    <button onclick="deleteSiteConfirm('${site.site_id}', '${site.site_name}')" 
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
    console.log('🎯 Site seçildi:', siteId, siteName);
    
    localStorage.setItem('selectedSite', JSON.stringify({
        site_id: siteId,
        site_name: siteName
    }));
    
    showToast(`✅ "${siteName}" sitesi seçildi! Site paneline yönlendiriliyorsunuz...`, 'success');
    
    setTimeout(() => {
        window.location.href = `/site-panel.html?siteId=${siteId}`;
    }, 1500);
}

// Site oluşturma formu
const createSiteForm = document.getElementById('createSiteForm');
if (createSiteForm) {
    createSiteForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const token = getAuthToken();
        const userData = JSON.parse(localStorage.getItem('user'));
        
        if (!token) {
            showToast("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.", "error");
            setTimeout(() => window.location.href = '/login.html', 1500);
            return;
        }

        // BİREYSEL HESAP LİMİT KONTROLÜ
        if (userData.role === 'INDIVIDUAL') {
            const totalSites = parseInt(document.getElementById('totalSites').textContent) || 0;
            
            if (totalSites >= 1) {
                showToast("❌ Bireysel hesaplar maksimum 1 site oluşturabilir!", "error");
                closeCreateModal();
                return;
            }
        }

        const siteData = {
            site_id: document.getElementById('siteId').value.trim().toUpperCase(),
            site_name: document.getElementById('siteName').value.trim(),
            site_address: document.getElementById('siteAddress').value.trim(),
            block_count: parseInt(document.getElementById('blockCount').value) || 0,
            apartment_count: parseInt(document.getElementById('apartmentCount').value) || 0,
        };

        // Validasyon
        if (!siteData.site_id || !siteData.site_name || !siteData.site_address) {
            showToast("Lütfen tüm zorunlu alanları doldurun!", "error");
            return;
        }

        if (siteData.site_id.length < 4) {
            showToast("Site ID en az 4 karakter olmalıdır!", "error");
            return;
        }

        console.log('📤 Site oluşturuluyor:', siteData);

        try {
            const response = await fetch(`${API_BASE_URL}/sites/create`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(siteData)
            });

            const data = await response.json();
            console.log('📥 Response:', data);

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Site oluşturulamadı');
            }

            showToast("✅ Site başarıyla oluşturuldu!", "success");
            closeCreateModal();
            
            setTimeout(() => fetchSites(), 500);

        } catch (err) {
            console.error('❌ Site oluşturma hatası:', err);
            showToast(err.message, "error");
        }
    });
}

// Site düzenleme
function editSite(siteId) {
    console.log('✏️ Site düzenleniyor:', siteId);
    showToast("Site düzenleme özelliği yakında eklenecek!", "info");
}

// Site silme onayı
function deleteSiteConfirm(siteId, siteName) {
    if (confirm(`"${siteName}" sitesini silmek istediğinizden emin misiniz?\n\n⚠️ Bu işlem geri alınamaz!`)) {
        deleteSite(siteId);
    }
}

// Site silme
async function deleteSite(siteId) {
    const token = getAuthToken();
    
    if (!token) {
        showToast("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.", "error");
        setTimeout(() => window.location.href = '/login.html', 1500);
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

        showToast("✅ Site başarıyla silindi!", "success");
        
        setTimeout(() => fetchSites(), 500);

    } catch (err) {
        console.error('❌ Site silme hatası:', err);
        showToast(err.message, "error");
    }
}

// Modal
function openCreateModal() {
    const userData = JSON.parse(localStorage.getItem('user'));
    
    // BİREYSEL HESAP LİMİT KONTROLÜ
    if (userData.role === 'INDIVIDUAL') {
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
    const code = codeEl.textContent;
    
    if (code && code !== 'KOD YOK') {
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
        window.location.href = 'login.html';
    }
}
// Token kontrolü
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        const token = getAuthToken();
        if (!token) {
            localStorage.clear();
            window.location.href = '/login.html';
        }
    }
});

// Modal dışına tıklayınca kapat
document.addEventListener('click', (e) => {
    const modal = document.getElementById('createModal');
    if (modal && e.target === modal) {
        closeCreateModal();
    }
});