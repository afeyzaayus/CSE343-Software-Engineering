// js/modules/api.js

export async function apiCall(endpoint, method = 'GET', data = null, requiresAuth = false) {
    // API'nin ana adresi. Tüm çağrılar buraya eklenir.
    const BASE_API_URL = 'http://localhost:3000/api';
    
    // Token'ı kalıcı olarak sessionStorage'dan okuyoruz.
    const token = sessionStorage.getItem('authToken'); 
    
    const headers = {
        'Content-Type': 'application/json',
    };

    // TEST İÇİN: requiresAuth varsayılan olarak false yapıldı
    if (requiresAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('API Call:', method, endpoint, 'RequiresAuth:', requiresAuth);
    
    const config = {
        method: method,
        headers: headers,
        body: data ? JSON.stringify(data) : null,
    };

    try {
        const response = await fetch(`${BASE_API_URL}${endpoint}`, config);
        return response; 
    } catch (error) {
        console.error("API Bağlantı Hatası:", error);
        return { 
            ok: false, 
            json: async () => ({ 
                message: 'Ağ veya bağlantı hatası.' 
            })
        };
    }
}