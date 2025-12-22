const API_URL = 'http://localhost:3000/api/auth';

// --- Page Navigation ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    const subtitles = {
        'login-page': 'Hoş Geldiniz',
        'package-page': 'Hesap Türü Seçin',
        'individual-register-page': 'Bireysel Hesap',
        'company-register-page': 'Şirket Hesabı',
        'verification-page': 'Son Adım'
    };
    document.getElementById('header-subtitle').textContent = subtitles[pageId] || 'Hoş Geldiniz';
}

document.getElementById('go-to-master-panel').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'master/login.html';
});
// --- Alerts ---
function showAlert(elementId, message, type) {
    const alert = document.getElementById(elementId);
    alert.className = `alert ${type} show`;
    alert.textContent = message;
    setTimeout(() => alert.classList.remove('show'), 3000);
}

// --- Password Strength ---
function updatePasswordStrength(password, barId) {
    const bar = document.getElementById(barId);

    if (!password) {
        bar.style.width = '0%';
        bar.style.background = '#e0e0e0';
        return;
    }

    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;

    bar.style.width = strength + '%';
    bar.style.background = strength < 50 ? '#dc3545' : strength < 75 ? '#ffc107' : '#28a745';
}

// --- Company ID ---
function generateCompanyId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- Tab Navigation ---
document.getElementById('tab-login').addEventListener('click', () => {
    document.getElementById('tab-login').classList.add('active');
    document.getElementById('tab-register').classList.remove('active');
    showPage('login-page');
});
document.getElementById('tab-register').addEventListener('click', () => {
    document.getElementById('tab-register').classList.add('active');
    document.getElementById('tab-login').classList.remove('active');
    showPage('package-page');
});

// --- Back Buttons ---
['back-to-login', 'go-to-login-from-verification'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
        showPage('login-page');
        document.getElementById('tab-login').classList.add('active');
        document.getElementById('tab-register').classList.remove('active');
    });
});

['back-to-package-from-individual', 'back-to-package-from-company'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
        showPage('package-page');
        document.getElementById('tab-login').classList.remove('active');
        document.getElementById('tab-register').classList.add('active');
    });
});

// --- Package Selection ---
document.querySelectorAll('.package-card').forEach(card => {
    card.addEventListener('click', () => {
        const packageType = card.dataset.package;
        document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        setTimeout(() => {
            if (packageType === 'individual') {
                showPage('individual-register-page');
            } else {
                const companyId = generateCompanyId();
                document.getElementById('company-id-value').textContent = companyId;
                document.getElementById('company-id-display').style.display = 'block';
                showPage('company-register-page');
            }
        }, 300);
    });
});

// --- Password Strength Listeners ---
document.getElementById('individual-password').addEventListener('input', e => {
    updatePasswordStrength(e.target.value, 'individual-strength-bar');
});
document.getElementById('company-password').addEventListener('input', e => {
    updatePasswordStrength(e.target.value, 'company-strength-bar');
});

// --- Login Form ---
document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('adminToken', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.admin));
            showAlert('login-alert', 'Giriş başarılı! Yönlendiriliyorsunuz...', 'alert-success');
            setTimeout(() => window.location.href = 'admin-dashboard.html', 1500);
        } else {
            showAlert('login-alert', data.message || 'Giriş başarısız!', 'alert-error');
        }
    } catch (error) {
        console.error(error);
        showAlert('login-alert', 'Bağlantı hatası! Lütfen tekrar deneyin.', 'alert-error');
    }
});

// --- Individual Register Form ---
document.getElementById('individual-form').addEventListener('submit', async e => {
    e.preventDefault();
    const fullname = document.getElementById('individual-fullname').value;
    const email = document.getElementById('individual-email').value;
    const password = document.getElementById('individual-password').value;
    const passwordConfirm = document.getElementById('individual-password-confirm').value;

    if (password !== passwordConfirm) {
        showAlert('individual-alert', 'Şifreler eşleşmiyor!', 'alert-error');
        return;
    }
    if (password.length < 6) {
        showAlert('individual-alert', 'Şifre en az 6 karakter olmalıdır!', 'alert-error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/register/individual`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name: fullname, email, password, password_confirm: passwordConfirm })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('verification-email').textContent = email;
            document.getElementById('individual-form').reset();
            updatePasswordStrength('', 'individual-strength-bar');
            showPage('verification-page');
        } else {
            showAlert('individual-alert', data.message || 'Kayıt başarısız!', 'alert-error');
        }
    } catch (error) {
        showAlert('individual-alert', 'Bağlantı hatası! Lütfen tekrar deneyin.', 'alert-error');
    }
});

// --- Company Register Form ---
document.getElementById('company-form').addEventListener('submit', async e => {
    e.preventDefault();
    const companyName = document.getElementById('company-name').value;
    const companyCode = document.getElementById('company-id-value').textContent;
    const managerName = document.getElementById('company-manager-name').value;
    const email = document.getElementById('company-email').value;
    const password = document.getElementById('company-password').value;
    const passwordConfirm = document.getElementById('company-password-confirm').value;

    if (password !== passwordConfirm) {
        showAlert('company-alert', 'Şifreler eşleşmiyor!', 'alert-error');
        return;
    }
    if (password.length < 6) {
        showAlert('company-alert', 'Şifre en az 6 karakter olmalıdır!', 'alert-error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/register/company-manager`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                company_name: companyName,
                company_code: companyCode,
                full_name: managerName,
                email,
                password,
                password_confirm: passwordConfirm
            })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('verification-email').textContent = email;
            document.getElementById('company-form').reset();
            updatePasswordStrength('', 'company-strength-bar');
            document.getElementById('company-id-display').style.display = 'none';
            showPage('verification-page');
        } else {
            showAlert('company-alert', data.message || 'Kayıt başarısız!', 'alert-error');
        }
    } catch (error) {
        showAlert('company-alert', 'Bağlantı hatası! Lütfen tekrar deneyin.', 'alert-error');
    }
});

// --- Forgot Password Modal ---
document.getElementById('forgot-password-link').addEventListener('click', () => {
    document.getElementById('forgot-password-modal').classList.add('show');
});
document.getElementById('close-forgot-modal').addEventListener('click', () => {
    document.getElementById('forgot-password-modal').classList.remove('show');
});
document.getElementById('forgot-password-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;

    try {
        const response = await fetch(`${API_URL}/password-reset/admin/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('forgot-alert', 'Şifre sıfırlama linki e-posta adresinize gönderildi.', 'alert-success');
        } else {
            showAlert('forgot-alert', data.message || 'İşlem başarısız! E-posta adresi bulunamadı.', 'alert-error');
        }
    } catch (error) {
        showAlert('forgot-alert', 'Bağlantı hatası! Lütfen tekrar deneyin.', 'alert-error');
    }
});

function formatCurrency(value) {
    return Number(value).toLocaleString('tr-TR');
}

fetch('http://localhost:3000/api/master/prices')
  .then(res => res.json())
  .then(response => {
    const data = response.data || {};
    // Bireysel fiyat
    const individualYear = Number(data.individual) || 0;
    const individualMonth = Math.round(individualYear / 12);
    document.getElementById('individual-package-price').textContent =
      `Aylık yaklaşık: ${formatCurrency(individualMonth)}₺`;
    document.getElementById('individual-package-yearly').textContent =
      individualYear > 0 ? `Yıllık ödeme: ${formatCurrency(individualYear)}₺` : 'Yıllık ödeme: Ücretsiz';

    // Şirket fiyat
    const companyYear = Number(data.company) || 0;
    const companyMonth = Math.round(companyYear / 12);
    document.getElementById('company-package-price').textContent =
      `Aylık yaklaşık: ${formatCurrency(companyMonth)}₺`;
    document.getElementById('company-package-yearly').textContent =
      companyYear > 0 ? `Yıllık ödeme: ${formatCurrency(companyYear)}₺` : 'Yıllık ödeme: Ücretsiz';
  })
  .catch(() => {
    document.getElementById('individual-package-price').textContent = 'Aylık yaklaşık: 0₺';
    document.getElementById('individual-package-yearly').textContent = 'Yıllık ödeme: Ücretsiz';
    document.getElementById('company-package-price').textContent = 'Aylık yaklaşık: 0₺';
    document.getElementById('company-package-yearly').textContent = 'Yıllık ödeme: Ücretsiz';
  });