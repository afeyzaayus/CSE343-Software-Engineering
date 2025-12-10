// js/modules/site.js

import { apiCall } from './api.js';

// Site bilgisini sessionStorage'da tutar
export function saveSiteData(site) {
    sessionStorage.setItem('currentSite', JSON.stringify(site));
    sessionStorage.setItem('siteId', site.site_id); // Backend'den gelen 'site_id' kullanıldı
}

export function getCurrentSiteId() {
    return sessionStorage.getItem('siteId');
}

// Yeni site oluşturma
// Endpoint: POST /api/sites (Backend kontratına uygun)
export async function createSite(siteData) {
    try {
        // apiCall içinde URL'e "/sites" eklenir. Yetkilendirme (true) gerekli.
        const response = await apiCall('/sites', 'POST', siteData, true); 

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Site oluşturulamadı.');
        }

        const result = await response.json();
        
        // Site oluşturulduktan sonra, bu siteyi aktif site olarak kaydet
        saveSiteData(result.site); 
        
        return result;

    } catch (error) {
        console.error('Site Oluşturma Hatası:', error);
        throw error;
    }
}

// Kullanıcının yönettiği/kayıtlı olduğu siteleri listeleme
// Endpoint: GET /api/sites/my
export async function getUserSites() {
    try {
        const response = await apiCall('/sites/my', 'GET', null, true); // Yetkilendirme gerekli
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Siteler yüklenemedi.');
        }

        const result = await response.json();
        return result.sites; // Backend'in siteleri 'sites' array'i içinde döndürdüğünü varsayıyoruz.

    } catch (error) {
        console.error('Site Listeleme Hatası:', error);
        throw error;
    }
}

// Seçilen siteyi kaydetme (Giriş sonrası site seçimi için)
export function selectSite(site) {
    saveSiteData(site);
    window.location.href = 'dashboard.html';
}