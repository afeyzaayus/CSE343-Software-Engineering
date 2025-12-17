import { setToken, setUserData, showToast } from './common.js';

const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    console.log('login.js yüklendi, DOMContentLoaded tetiklendi');

    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (!loginForm) {
        console.error('loginForm bulunamadı! HTML içinde id="loginForm" olan bir <form> var mı?');
        return;
    }

    // Başlangıçta error mesajını gizle
    if (loginError) {
        loginError.textContent = '';
        loginError.style.display = 'none';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Login form submit tetiklendi');
        
        // Form submit edildiğinde error mesajını gizle
        if (loginError) {
            loginError.textContent = '';
            loginError.style.display = 'none';
        }

        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;

        console.log('Gönderilen email:', email);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/master/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            console.log('Login response status:', response.status);

            const result = await response.json();
            console.log('Login response body:', result);

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Giriş başarısız');
            }

            const { token, user } = result.data || {};

            if (token) {
                setToken(token);
                setUserData(user);
                showToast('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');

                console.log('Dashboard\'a yönlendiriliyor...');
                window.location.href = 'dashboard.html';
            } else {
                throw new Error('Token alınamadı.');
            }
        } catch (error) {
            console.error('Login hatası:', error);
            if (loginError) {
                loginError.textContent = error.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
                loginError.style.display = 'block'; // Hata olduğunda göster
            }
            showToast('Giriş başarısız!', 'error');
        }
    });
});