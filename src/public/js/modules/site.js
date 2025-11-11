// js/modules/site.js

// Site bilgisini sessionStorage'da tutar
export function saveSiteData(site) {
    // store full object for convenience
    sessionStorage.setItem('currentSite', JSON.stringify(site));
    // store numeric database id expected by backend routes
    if (site.id !== undefined) {
        sessionStorage.setItem('siteId', String(site.id));
    } else if (site.site_id !== undefined && site.id === undefined) {
        // fallback: if only site_id (uuid) exists, store it under a different key
        sessionStorage.setItem('siteUuid', site.site_id);
    }
}

export function getCurrentSiteId() {
    return sessionStorage.getItem('siteId');
}

// Yeni site oluşturma
// Endpoint: POST /api/sites
export async function createSite(siteData) {
    const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteData)
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Site oluşturulamadı');
    }

    const site = await res.json();
    saveSiteData(site);
    return site;
}

// Siteleri listeleme
export async function getUserSites() {
    const res = await fetch('/api/sites');
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Siteler yüklenemedi');
    }
    return res.json();
}

// Seçilen siteyi kaydet ve dashboard'a git
export function selectSite(site) {
    saveSiteData(site);
    window.location.href = 'dashboard.html';
}