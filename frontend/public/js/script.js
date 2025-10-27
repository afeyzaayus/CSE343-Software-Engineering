const BASE_URL = 'http://localhost:3000/api/auth';

let currentUser = null;
let currentToken = null;
let userSites = [];

const pages = {
    auth: document.getElementById('auth-container'),
    userDashboard: document.getElementById('user-dashboard'),
    adminDashboard: document.getElementById('admin-dashboard')
};

// Auth Sayfası geçişleri
function showLogin() {
    document.getElementById('auth-pages').classList.remove('slide-left');
    document.getElementById('auth-pages').classList.add('slide-right');
    updateAllAuthButtons(true);
    document.getElementById('register-form').reset();
    hideAlert('register-alert');
}

function showRegister() {
    document.getElementById('auth-pages').classList.remove('slide-right');
    document.getElementById('auth-pages').classList.add('slide-left');
    updateAllAuthButtons(false);
    document.getElementById('login-form').reset();
    hideAlert('login-alert');
}

function updateAllAuthButtons(isLoginActive) {
    document.querySelectorAll('.auth-switch').forEach(switchContainer => {
        const buttons = switchContainer.querySelectorAll('.auth-switch-btn');
        buttons.forEach((btn, index) => btn.classList.toggle('active', isLoginActive ? index === 0 : index === 1));
    });
}

function showPage(pageToShow) {
    Object.values(pages).forEach(page => page.classList.add('hidden'));
    if (pageToShow) pageToShow.classList.remove('hidden');
}

// Alert göster/gizle
function showAlert(elementId, message, isError = false) {
    const alert = document.getElementById(elementId);
    alert.textContent = message;
    alert.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
    alert.classList.remove('hidden');
    setTimeout(() => alert.classList.add('hidden'), 5000);
}

function hideAlert(elementId) {
    const alert = document.getElementById(elementId);
    alert.classList.add('hidden');
}

// API Request
async function apiRequest(endpoint, data = {}, requiresAuth = false, method = 'POST') {
    const headers = { 'Content-Type': 'application/json' };
    if (requiresAuth && currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers,
            body: method === 'GET' ? undefined : JSON.stringify(data)
        });
        const result = await response.json();
        return { ok: response.ok, data: result };
    } catch (error) {
        console.error('API Hatası:', error);
        return { ok: false, data: { message: 'Bağlantı hatası' } };
    }
}

// Login/Register alan toggle
function toggleLoginFields(isAdmin) {
    document.getElementById('user-login-fields').classList.toggle('hidden', isAdmin);
    document.getElementById('admin-login-fields').classList.toggle('hidden', !isAdmin);
}

function toggleRegisterFields(isAdmin) {
    const userFields = document.getElementById('user-register-fields');
    const adminFields = document.getElementById('admin-register-fields');
    
    userFields.classList.toggle('hidden', isAdmin);
    adminFields.classList.toggle('hidden', !isAdmin);

    // User alanlarının required durumunu güncelle
    userFields.querySelectorAll('input').forEach(input => {
        input.required = !isAdmin;
        if (isAdmin) input.value = '';
    });

    // Admin alanlarının required durumunu güncelle
    adminFields.querySelectorAll('input').forEach(input => {
        input.required = isAdmin;
        if (!isAdmin) input.value = '';
    });
    
    adminFields.querySelectorAll('select').forEach(select => {
        select.required = isAdmin;
    });
}

// Event Listeners
document.getElementById('login-type').addEventListener('change', e => toggleLoginFields(e.target.value === 'admin'));
document.getElementById('register-type').addEventListener('change', e => {
    toggleRegisterFields(e.target.value === 'admin');
});

// Company name field toggle
document.getElementById('register-account-type')?.addEventListener('change', e => {
    const companyNameGroup = document.getElementById('company-name-group');
    if (companyNameGroup) {
        companyNameGroup.style.display = e.target.value === 'COMPANY' ? 'block' : 'none';
    }
});

// LOGIN
document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const loginType = document.getElementById('login-type').value;
    const data = loginType === 'admin'
        ? { email: document.getElementById('login-email').value, password: document.getElementById('login-password').value }
        : { phone_number: document.getElementById('login-phone').value, password: document.getElementById('login-password').value };
    const endpoint = loginType === 'admin' ? '/admin/login' : '/user/login';
    const response = await apiRequest(endpoint, data);

    if (response.ok) {
        currentToken = response.data.token;
        currentUser = response.data.admin || response.data.user;
        showPage(loginType === 'admin' ? pages.adminDashboard : pages.userDashboard);
        loginType === 'admin' ? showAdminDashboard() : showUserDashboard();
    } else {
        showAlert('login-alert', response.data.message || 'Giriş başarısız', true);
    }
});

// REGISTER
document.getElementById('register-form').addEventListener('submit', async e => {
    e.preventDefault();
    
    const registerType = document.getElementById('register-type').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    
    // Şifre kontrolü
    if (password !== passwordConfirm) {
        showAlert('register-alert', 'Şifreler eşleşmiyor!', true);
        return;
    }

    // Kayıt verilerini oluştur
    let data;
    if (registerType === 'admin') {
        const adminEmail = document.getElementById('admin-register-fields').querySelector('input[type="email"]');
        data = {
            full_name: document.getElementById('register-fullname').value,
            email: adminEmail ? adminEmail.value : '',
            password,
            account_type: document.getElementById('register-account-type').value,
            company_name: document.getElementById('register-account-type').value === 'COMPANY' 
                ? document.getElementById('register-company').value 
                : undefined
        };
    } else {
        data = {
            full_name: document.getElementById('register-fullname').value,
            phone_number: document.getElementById('register-phone').value,
            password,
            site_id: document.getElementById('register-siteid').value,
            block_no: document.getElementById('register-block').value,
            apartment_no: document.getElementById('register-apartment').value
        };
    }

    const endpoint = registerType === 'admin' ? '/admin/register' : '/user/register';
    const response = await apiRequest(endpoint, data);

    if (response.ok) {
        if (registerType === 'admin') {
            // ADMIN KAYDI
            showAlert('register-alert', 'Kayıt başarılı! E-postanızı doğrulayın.', false);
            setTimeout(showLogin, 2000);
        } else {
            // USER KAYDI - MODAL
            const phoneNumber = document.getElementById('register-phone').value;
            showVerifyModal(phoneNumber);
        }
    } else {
        showAlert('register-alert', response.data.message || 'Kayıt başarısız', true);
    }
});

// DOĞRULAMA MODALI
function showVerifyModal(phoneNumber) {
    const modal = document.getElementById('verify-modal');
    const verifyInput = document.getElementById('verify-code');
    const verifyBtn = document.getElementById('verify-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    
    modal.classList.remove('hidden');
    verifyInput.value = '';
    
    // Küçük gecikme ile focus (modal animasyonu için)
    setTimeout(() => verifyInput.focus(), 100);

    // Eski event listener'ları temizle
    const newVerifyBtn = verifyBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    verifyBtn.parentNode.replaceChild(newVerifyBtn, verifyBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    const handleVerify = async () => {
        const code = verifyInput.value.trim();
        
        if (!code) {
            showModalError('Lütfen doğrulama kodunu girin!');
            return;
        }
        
        if (code.length !== 6) {
            showModalError('Kod 6 haneli olmalıdır!');
            return;
        }

        // Butonu devre dışı bırak
        newVerifyBtn.disabled = true;
        newVerifyBtn.textContent = 'Doğrulanıyor...';

        const response = await apiRequest('/user/verify-phone', {
            phone_number: phoneNumber,
            code: code
        });

        if (response.ok) {
            modal.classList.add('hidden');
            showAlert('register-alert', '✅ Telefon doğrulandı! Giriş yapabilirsiniz.', false);
            setTimeout(() => {
                document.getElementById('register-form').reset();
                showLogin();
                document.getElementById('login-phone').value = phoneNumber;
                showAlert('login-alert', 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.', false);
            }, 1500);
        } else {
            // Butonu tekrar aktif et
            newVerifyBtn.disabled = false;
            newVerifyBtn.textContent = 'Doğrula';
            showModalError(response.data.message || 'Doğrulama başarısız!');
        }
    };

    const handleCancel = () => {
        modal.classList.add('hidden');
        verifyInput.value = '';
    };

    // Enter tuşu ile doğrulama
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleVerify();
        }
    };

    newVerifyBtn.addEventListener('click', handleVerify);
    newCancelBtn.addEventListener('click', handleCancel);
    verifyInput.addEventListener('keypress', handleKeyPress);
}

function showModalError(message) {
    const modal = document.getElementById('verify-modal');
    const existingError = modal.querySelector('.modal-error');
    
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'modal-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #e74c3c; font-size: 13px; margin-top: -10px; margin-bottom: 10px;';
    
    const input = document.getElementById('verify-code');
    input.parentNode.insertBefore(errorDiv, input.nextSibling);
    
    // Input'a kırmızı border ekle
    input.style.borderColor = '#e74c3c';
    
    // 3 saniye sonra hatayı kaldır
    setTimeout(() => {
        errorDiv.remove();
        input.style.borderColor = '';
    }, 3000);
}

// DASHBOARD
function showUserDashboard() {
    if (!currentUser) return;
    document.getElementById('user-name').textContent = currentUser.full_name || 'Kullanıcı';
    document.getElementById('user-role').textContent = 'Site Kullanıcısı';
    document.getElementById('user-avatar').textContent = (currentUser.full_name || 'U')[0].toUpperCase();
    document.getElementById('welcome-title').textContent = `Hoş Geldiniz, ${currentUser.full_name}!`;
}

function showAdminDashboard() {
    if (!currentUser) return;
    document.getElementById('admin-name').textContent = currentUser.full_name || 'Admin';
    document.getElementById('admin-type').textContent = currentUser.account_type || 'INDIVIDUAL';
    document.getElementById('admin-avatar').textContent = (currentUser.full_name || 'A')[0].toUpperCase();
    document.getElementById('site-limit').textContent = currentUser.account_type === 'COMPANY' ? 5 : 1;
    loadSites();
}

// SITE MANAGEMENT
async function loadSites() {
    const response = await apiRequest('/site/admin-sites', {}, true, 'GET');
    userSites = response.ok && Array.isArray(response.data.sites) ? response.data.sites : [];
    updateSitesList();
}

function updateSitesList() {
    const sitesList = document.getElementById('sites-list');
    document.getElementById('total-sites').textContent = userSites.length;
    if (!userSites.length) {
        sitesList.innerHTML = `<div class="empty-state"><h3>Henüz Site Yok</h3><p>Aşağıdaki formu kullanarak ilk sitenizi oluşturun.</p></div>`;
    } else {
        sitesList.innerHTML = userSites.map(site => `
            <div class="site-card">
                <h3>${site.site_name}</h3>
                <p><strong>Site ID:</strong> ${site.site_id}</p>
                <p><strong>Adres:</strong> ${site.site_address}</p>
                <span class="badge">Aktif</span>
                <div class="site-actions">
                    <button class="btn-small btn-select" onclick="selectSite('${site.site_id}')">Siteyi Seç</button>
                </div>
            </div>
        `).join('');
    }
}

function generateSiteId(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const siteIdInput = document.getElementById('site-id');
    if (siteIdInput) siteIdInput.value = generateSiteId();
    
    // Sayfa yüklendiğinde register alanlarını ayarla
    toggleRegisterFields(document.getElementById('register-type').value === 'admin');
    
    showLogin();
});

document.getElementById('create-site-form').addEventListener('submit', async e => {
    e.preventDefault();
    const siteIdInput = document.getElementById('site-id');
    const data = {
        site_id: siteIdInput.value,
        site_name: document.getElementById('site-name').value,
        site_address: document.getElementById('site-address').value
    };
    const response = await apiRequest('/site/create', data, true);
    if (response.ok) {
        showAlert('create-site-alert', 'Site başarıyla oluşturuldu!', false);
        userSites.push(data);
        updateSitesList();
        e.target.reset();
        siteIdInput.value = generateSiteId();
    } else {
        showAlert('create-site-alert', response.data.message || 'Site oluşturulamadı', true);
    }
});

function selectSite(siteId) {
    showPage(pages.userDashboard);
    const selectedSite = userSites.find(s => s.site_id === siteId);
    if (selectedSite) {
        document.getElementById('welcome-title').textContent = `${selectedSite.site_name} - Yönetim Paneli`;
    }
}

function logout() {
    currentUser = null;
    currentToken = null;
    userSites = [];
    showPage(pages.auth);
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    showLogin();
}