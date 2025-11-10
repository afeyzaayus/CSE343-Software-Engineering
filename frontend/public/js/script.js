const BASE_URL = 'http://localhost:3000';

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
    const token = localStorage.getItem('authToken');
    if (requiresAuth && token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`${BASE_URL}/api/auth${endpoint}`, {
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
function toggleLoginFields() {
    document.getElementById('admin-login-fields').classList.remove('hidden');
}

function toggleRegisterFields() {
    const adminFields = document.getElementById('admin-register-fields');
    adminFields.classList.remove('hidden');

    const accountTypeSelect = document.getElementById('register-account-type');
    const companyInput = document.getElementById('register-company');

    adminFields.querySelectorAll('input, select').forEach(el => {
        if (el.type === 'email' || el.id === 'register-password' || el.id === 'register-password-confirm') {
            el.required = true;
        } else {
            el.required = false;
        }
    });

    accountTypeSelect.addEventListener('change', e => {
        if (e.target.value === 'COMPANY') {
            companyInput.required = true;
        } else {
            companyInput.required = false;
            companyInput.value = '';
        }
    });
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    toggleLoginFields();
    toggleRegisterFields();
    showLogin();

    // Company name field toggle
    const accountTypeSelect = document.getElementById('register-account-type');
    if (accountTypeSelect) {
        accountTypeSelect.addEventListener('change', e => {
            const companyNameGroup = document.getElementById('company-name-group');
            if (companyNameGroup) {
                companyNameGroup.style.display = e.target.value === 'COMPANY' ? 'block' : 'none';
            }
        });
    }
});

// LOGIN
document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
    };

    const response = await apiRequest('/admin/login', data);

    if (response.ok) {
        // Token ve kullanıcı bilgisini localStorage'a kaydet
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('currentUser', JSON.stringify(response.data.admin));
        
        // Admin dashboard'a yönlendir
        window.location.href = 'site-selection.html';
    } else {
        showAlert('login-alert', response.data.message || 'Giriş başarısız', true);
    }
});

// REGISTER
document.getElementById('register-form').addEventListener('submit', async e => {
    e.preventDefault();

    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    if (password !== passwordConfirm) {
        showAlert('register-alert', 'Şifreler eşleşmiyor!', true);
        return;
    }

    const data = {
        full_name: document.getElementById('register-fullname').value,
        email: document.querySelector('#admin-register-fields input[type="email"]').value,
        password,
        account_type: document.getElementById('register-account-type').value,
        company_name:
            document.getElementById('register-account-type').value === 'COMPANY'
                ? document.getElementById('register-company').value
                : undefined
    };

    const response = await apiRequest('/admin/register', data);

    if (response.ok) {
        showAlert('register-alert', 'Kayıt başarılı! E-postanızı doğrulayın.', false);
        setTimeout(showLogin, 2000);
    } else {
        showAlert('register-alert', response.data.message || 'Kayıt başarısız', true);
    }
});

// Şifremi Unuttum Modal
document.getElementById('forgot-password-link').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('forgot-password-modal').classList.remove('hidden');
});

document.getElementById('cancel-reset-btn').addEventListener('click', () => {
    document.getElementById('forgot-password-modal').classList.add('hidden');
    document.getElementById('forgot-password-email').value = '';
    hideAlert('forgot-password-alert');
});

document.getElementById('send-reset-btn').addEventListener('click', async () => {
    const email = document.getElementById('forgot-password-email').value;

    if (!email) {
        showAlert('forgot-password-alert', 'Lütfen e-posta adresinizi girin.', true);
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/auth/admin/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('forgot-password-alert', data.message || 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.', false);
            setTimeout(() => {
                document.getElementById('forgot-password-modal').classList.add('hidden');
                document.getElementById('forgot-password-email').value = '';
                hideAlert('forgot-password-alert');
            }, 3000);
        } else {
            showAlert('forgot-password-alert', data.message || 'Bir hata oluştu.', true);
        }
    } catch (error) {
        console.error('Şifre sıfırlama hatası:', error);
        showAlert('forgot-password-alert', 'Sunucuya bağlanılamadı.', true);
    }
});