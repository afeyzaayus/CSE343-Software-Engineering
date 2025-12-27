// Kullanıcı bilgilerini localStorage'dan al ve göster
function updateUserInfoDisplay() {
    // localStorage'dan kullanıcı bilgisini al
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        console.warn('currentUser bulunamadı, kullanıcı bilgisi gösterilemiyor');
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

// Sayfa yüklendiğinde otomatik çalıştır
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateUserInfoDisplay);
} else {
    // DOMContentLoaded zaten geçmişse hemen çalıştır
    updateUserInfoDisplay();
}

