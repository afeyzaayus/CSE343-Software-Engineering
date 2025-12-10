
import { apiCall } from './api.js';

let currentToken = null;

// --- Veri Depolama Fonksiyonları ---
function saveAuthData(token, user) {
    currentToken = token;
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('authUser', JSON.stringify(user));
}

function getAuthToken() {
    if (!currentToken) {
        currentToken = sessionStorage.getItem('authToken');
    }
    return currentToken;
}

function getAuthUser() {
    const user = sessionStorage.getItem('authUser');
    return user ? JSON.parse(user) : null;
}

function clearAuthData() {
    currentToken = null;
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUser');
}

// --- Temel Auth API Fonksiyonları ---

async function register(userType, data) {
    // Endpoint: /api/auth/{userType}/register
    const endpoint = `/auth/${userType}/register`; 
    
    // Kayıt token gerektirmediği için needsAuth = false
    const response = await apiCall(endpoint, 'POST', data, false); 
    
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Kayıt başarısız');
    }
    return await response.json();
}

// *** Login fonksiyonu da benzer mantıkta olmalıdır ***
async function login(userType, data) {
    // Endpoint: /api/auth/{userType}/login
    const endpoint = `/auth/${userType}/login`;
    const response = await apiCall(endpoint, 'POST', data, false); 
    
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Giriş başarısız');
    }
    
    const result = await response.json();
    saveAuthData(result.token, result.user); // Başarılı girişte token'ı kaydet
    return result;
}
// ---------------------------------------------------

function setupAuthListeners() {
    const token = getAuthToken();
    if (token) {
        console.log('Kullanıcı login durumda:', getAuthUser());
    } else {
        console.log('Kullanıcı login değil');
    }
}


export function setupAuthForms(openModal, closeModal, createSite, selectSite, getUserSites) {
    // Sayfa Elementlerini Al
    const loginPage = document.getElementById('login-page');
    const registerPage = document.getElementById('register-page');

    // Sayfa Geçişleri için Listener'lar (MONOLİTİK YAPI DÜZELTMESİ)
    document.getElementById('show-register')?.addEventListener('click', function(e) {
        e.preventDefault();
        loginPage?.classList.add('hidden');
        registerPage?.classList.remove('hidden');
    });

    document.getElementById('show-login')?.addEventListener('click', function(e) {
        e.preventDefault();
        registerPage?.classList.add('hidden');
        loginPage?.classList.remove('hidden');
    });

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const createSiteForm = document.getElementById('create-site-form');

    // --- 1. KAYIT FORMU İŞLEMCİSİ ---
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const registerType = document.getElementById('register-type').value;

        // Admin kayıt akışı
        if (registerType === 'admin') {
            const fullName = document.getElementById('register-fullname').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value; // Şifre kontrolü eksik!
            const accountType = document.getElementById('register-account-type').value;
            
            // Şirket Adı sadece şirket tipiyse alınır
            const companyName = accountType === 'COMPANY' ? document.getElementById('register-company').value : undefined;

            // *** GEREKLİ DÜZELTME: FORM VERİLERİ BURADA TOPLANDI ***
            const data = {
                full_name: fullName,
                email: email,
                password: password,
                account_type: accountType,
                company_name: companyName
            };
            // *******************************************************
            
            try {
                // Endpoint: POST /api/auth/admin/register
                await register('admin', data); 
                
                alert('Yönetici Hesabı Oluşturuldu! Şimdi sitenizi tanımlayınız.');

                // Site ID'sini rastgele oluşturup forma koy 
                const tempSiteId = Math.random().toString(36).substring(2, 8).toUpperCase(); 
                document.getElementById('site-id').value = tempSiteId;
                
                // HTML'deki modal ID'sinin 'createSiteModal' olduğunu varsayıyoruz (Eğer farklıysa düzeltin!)
                openModal('createSiteModal'); 

            } catch (error) {
                // Hata mesajı monolitik HTML yapısına uygun olarak gösterilmeli
                // Örn: showAlert('register-alert', error.message, true);
                alert('Kayıt başarısız: ' + error.message);
            }
        } else {
            // Kullanıcı Kaydı akışı: Veri toplama burada yapılmalıdır (şu an eksik)
            alert('Kullanıcı kayıt akışı henüz tamamlanmadı.');
        }
    });

    // --- 2. SİTE OLUŞTURMA FORMU İŞLEMCİSİ ---
    createSiteForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            site_id: document.getElementById('site-id').value,
            site_name: document.getElementById('site-name').value,
            site_address: document.getElementById('site-address').value,
        };

        try {
            // Endpoint: POST /api/sites (site.js'ten çağrıldı)
            await createSite(data); 

            alert(`Site '${data.site_name}' başarıyla kaydedildi!`);
            // HTML'deki modal ID'sinin 'createSiteModal' olduğunu varsayıyoruz (Eğer farklıysa düzeltin!)
            closeModal('createSiteModal');
            
            // Site oluşturma başarılı, doğrudan dashboard'a git
            window.location.href = 'dashboard.html'; 

        } catch (error) {
            alert('Site oluşturulamadı: ' + error.message);
        }
    });

    // ... (Diğer form submit fonksiyonları buraya devam eder: loginForm) ...
}

// Dışa aktarımları (Exports) birleştirme
export { 
    getAuthToken, 
    getAuthUser, 
    clearAuthData, 
    setupAuthListeners 
    // setupAuthForms zaten yukarıda export edilmiş durumda
    // Login/Register fonksiyonları burada export edilmediği için,
    // farklı modüllerden çağrılamaz. Ancak setupAuthForms içinde kullanılıyor.
};