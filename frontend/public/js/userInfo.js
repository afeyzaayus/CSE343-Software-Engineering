// Kullanıcı bilgilerini localStorage'dan al ve göster
function updateUserInfoDisplay() {
    // ✅ Chrome cache sorununu çözmek için localStorage'ı her seferinde yeniden oku
    // Cache bypass: localStorage.getItem her çağrıldığında fresh data döner
    let currentUser = null;

    try {
        const userDataRaw = localStorage.getItem('currentUser');
        if (userDataRaw) {
            currentUser = JSON.parse(userDataRaw);
            console.log('🔄 UserInfo güncellendi:', currentUser.full_name || currentUser.name);
        }
    } catch (error) {
        console.error('❌ localStorage parse hatası:', error);
    }

    if (!currentUser) {
        console.warn('⚠️ currentUser bulunamadı, kullanıcı bilgisi gösterilemiyor');
        return;
    }

    // dashboard-user-info elementini ara
    let userInfo = document.getElementById('dashboard-user-info');

    // Yoksa .user-info class'ı ile ara
    if (!userInfo) {
        userInfo = document.querySelector('.user-info');
    }

    // userName elementini de güncelle (admin-dashboard.html için)
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = currentUser.full_name || currentUser.name || 'Kullanıcı';
    }

    // userAvatar elementini güncelle
    const userAvatarElement = document.getElementById('userAvatar');
    if (userAvatarElement) {
        userAvatarElement.textContent = (currentUser.full_name || currentUser.name || 'A')[0].toUpperCase();
    }

    // userType elementini güncelle
    const userTypeElement = document.getElementById('userType');
    if (userTypeElement) {
        userTypeElement.textContent = getRoleText(currentUser.account_type || currentUser.role || 'USER');
    }

    if (userInfo) {
        const fullName = currentUser.full_name || currentUser.name || 'Kullanıcı';
        const accountType = currentUser.account_type || currentUser.role || 'USER';
        const firstLetter = fullName[0].toUpperCase();

        userInfo.innerHTML = `
            <div class="user-avatar" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #2196F3; color: white; border-radius: 50%; font-weight: bold;">${firstLetter}</div>
            <div style="margin-left: 10px;">
                <div style="font-weight: 600;">${fullName}</div>
                <div style="font-size: 12px; opacity: 0.8;">${getRoleText(accountType)}</div>
            </div>
        `;
    }
}

// Rol ismini Türkçe'ye çevir
function getRoleText(role) {
    const roleMap = {
        'COMPANY_MANAGER': 'Şirket Yöneticisi',
        'COMPANY_EMPLOYEE': 'Şirket Çalışanı',
        'INDIVIDUAL': 'Bireysel Hesap'
    };
    return roleMap[role] || role;
}

// ✅ Sayfa yüklendiğinde otomatik çalıştır (Chrome cache bypass)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateUserInfoDisplay);
} else {
    // DOMContentLoaded zaten geçmişse hemen çalıştır
    updateUserInfoDisplay();
}

// ✅ Sayfa tamamen yüklendiğinde bir kez daha çalıştır (cache bypass için)
window.addEventListener('load', () => {
    console.log('🔄 Window load event - userInfo güncelleniyor...');
    updateUserInfoDisplay();
});

// ✅ Sayfa görünür hale geldiğinde güncelle (tab değişikliklerinde)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('👁️ Sayfa görünür hale geldi - userInfo güncelleniyor...');
        updateUserInfoDisplay();
    }
});

// ✅ Başka sekmede localStorage değişince güncelle
window.addEventListener('storage', (e) => {
    // currentUser veya user değiştiğinde güncelle
    if (e.key === 'currentUser' || e.key === 'user') {
        console.log('🔄 localStorage değişti, kullanıcı bilgisi güncelleniyor...');
        updateUserInfoDisplay();
    }

    // Logout yapıldığında (token silindiğinde) login sayfasına yönlendir
    if (e.key === 'adminToken' && e.newValue === null) {
        console.log('🚪 Başka sekmede çıkış yapıldı, login sayfasına yönlendiriliyorsunuz...');
        window.location.href = '/index.html';
    }
});

