 const API_BASE_URL = 'http://localhost:3000/api';
        let inviteCode = null;

        const passwordInput = document.getElementById('password');
        const strengthBar = document.getElementById('individual-strength-bar');
        const form = document.getElementById('individual-form');

        // Password strength checker
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            let strength = 0;
            if (password.length >= 6) strength++;
            if (password.length >= 10) strength++;
            if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
            if (/\d/.test(password)) strength++;
            if (/[^a-zA-Z\d]/.test(password)) strength++;

            strengthBar.className = 'password-strength-bar';
            if (password.length === 0) {
                strengthBar.style.width = '0%';
            } else if (strength < 3) {
                strengthBar.classList.add('weak');
            } else if (strength < 5) {
                strengthBar.classList.add('medium');
            } else {
                strengthBar.classList.add('strong');
            }
        });

        // Toast notification
        function showToast(message, type = 'info') {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.className = `toast ${type} show`;
            setTimeout(() => toast.classList.remove('show'), 4000);
        }

        // Loading state
        function setLoading(loading) {
            const submitBtn = document.querySelector('button[type="submit"]');
            const inputs = document.querySelectorAll('input');
            if (loading) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '⏳ Kayıt yapılıyor...';
                inputs.forEach(i => i.disabled = true);
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '✨ Kayıt Ol';
                inputs.forEach(i => i.disabled = false);
            }
        }

        // Validate invite code
        async function validateInviteCode() {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('inviteCode');
            if (!code) {
                showToast('❌ Geçersiz davet linki!', 'error');
                renderInvalidInvite();
                return false;
            }
            inviteCode = code;

            try {
                const res = await fetch(`${API_BASE_URL}/company/invitations/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invite_code: inviteCode })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Davet kodu doğrulanamadı');

                if (data.success) {
                    const banner = document.getElementById('companyInfoBanner');
                    banner.classList.add('show');
                    document.getElementById('companyName').textContent = data.data.company.company_name;
                    document.getElementById('companyCode').textContent = `Kod: ${data.data.company.company_code}`;

                    if (data.data.invited_email) {
                        const emailInput = document.getElementById('email');
                        emailInput.value = data.data.invited_email;
                        emailInput.readOnly = true;
                        emailInput.disabled = true;
                        document.getElementById('emailHelp').textContent = '✉️ Bu davet bu email adresine özeldir';
                    }

                    showToast('✅ Davet kodu geçerli!', 'success');
                    return true;
                }
            } catch (error) {
                console.error(error);
                showToast('❌ ' + error.message, 'error');
                renderInvalidInvite(error.message);
                return false;
            }
        }

        function renderInvalidInvite(message = '') {
            document.getElementById('employeeRegisterForm').innerHTML = `
                <div class="invalid-invite">
                    <div class="invalid-invite-icon">⚠️</div>
                    <h3>Davet Kodu Geçersiz</h3>
                    <p>${message || 'Bu sayfaya erişmek için geçerli bir davet linki gereklidir.'}</p>
                    <a href="index.html" class="btn btn-primary">← Giriş Sayfasına Dön</a>
                </div>
            `;
        }

        function validateForm({ fullName, email, password, confirmPassword }) {
            if (!fullName || fullName.length < 3) return 'Ad soyad en az 3 karakter olmalıdır!';
            if (!email) return 'Lütfen email adresinizi girin!';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) return 'Geçerli bir email adresi girin!';
            if (password.length < 6) return 'Şifre en az 6 karakter olmalıdır!';
            if (password !== confirmPassword) return 'Şifreler eşleşmiyor!';
            return null;
        }

        async function handleFormSubmit(e) {
            e.preventDefault();
            if (!inviteCode) {
                showToast('❌ Geçerli bir davet kodu bulunamadı!', 'error');
                return;
            }

            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            const validationError = validateForm({ fullName, email, password, confirmPassword });
            if (validationError) {
                showToast('❌ ' + validationError, 'error');
                return;
            }

            setLoading(true);

            try {
                const res = await fetch(`${API_BASE_URL}/company/invitations/accept`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invite_code: inviteCode, full_name: fullName, email, password })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Kayıt işlemi başarısız');

                if (data.success) {
                    showToast('✅ Kayıt başarılı! Yönlendiriliyorsunuz...', 'success');
                    setTimeout(() => window.location.href = 'index.html', 2000);
                }
            } catch (error) {
                console.error(error);
                showToast('❌ ' + error.message, 'error');
            } finally {
                setLoading(false);
            }
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            validateInviteCode();
            form.addEventListener('submit', handleFormSubmit);
        });