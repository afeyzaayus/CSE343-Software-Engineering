// Kullanıcı bilgilerini API'den güncel olarak çek ve göster
async function fetchAndUpdateUserInfo() {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    
    if (!token) {
        console.warn('Token bulunamadı, kullanıcı bilgisi güncellenemiyor');
        return null;
    }

    try {
        const response = await fetch('http://localhost:3000/api/accounts/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Kullanıcı bilgisi alınamadı');
        }

        const result = await response.json();
        const userData = result.data;

        // localStorage'ı güncelle
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const updatedUser = {
            ...currentUser,
            ...userData,
            name: userData.full_name, // Eski kod uyumluluğu için
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        // Sayfadaki user-info veya dashboard-user-info elementini güncelle
        updateUserInfoDisplay(userData);

        return userData;
    } catch (error) {
        console.error('Kullanıcı bilgisi güncellenirken hata:', error);
        return null;
    }
}

// Kullanıcı bilgisini sayfada göster
function updateUserInfoDisplay(userData) {
    // dashboard-user-info elementini ara
    let userInfo = document.getElementById('dashboard-user-info');
    
    // Yoksa .user-info class'ı ile ara
    if (!userInfo) {
        userInfo = document.querySelector('.user-info');
    }

    // userName elementini de güncelle (admin-dashboard.html için)
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = userData.full_name || userData.name || 'Kullanıcı';
    }

    // userAvatar elementini güncelle
    const userAvatarElement = document.getElementById('userAvatar');
    if (userAvatarElement) {
        userAvatarElement.textContent = (userData.full_name || userData.name || 'A')[0].toUpperCase();
    }

    // userType elementini güncelle
    const userTypeElement = document.getElementById('userType');
    if (userTypeElement) {
        userTypeElement.textContent = getRoleText(userData.account_type || userData.role || 'USER');
    }

    if (userInfo) {
        const fullName = userData.full_name || userData.name || 'Kullanıcı';
        const accountType = userData.account_type || userData.role || 'USER';
        const firstLetter = fullName[0].toUpperCase();

        userInfo.innerHTML = `
            <div class="user-avatar" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #2196F3; color: white; border-radius: 50%; font-weight: bold;">${firstLetter}</div>
            <div style="margin-left: 10px;">
                <div style="font-weight: 600;">${fullName}</div>
                <div style="font-size: 12px; opacity: 0.8;">${accountType}</div>
            </div>
        `;
    }
}

// Rol ismini Türkçe'ye çevir
function getRoleText(role) {
    const roleMap = {
        'SUPER_ADMIN': 'Süper Yönetici',
        'COMPANY_MANAGER': 'Şirket Yöneticisi',
        'INDIVIDUAL': 'Bireysel',
        'USER': 'Kullanıcı',
        'ADMIN': 'Yönetici'
    };
    return roleMap[role] || role;
}

// Sayfa yüklendiğinde otomatik çalıştır
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAndUpdateUserInfo);
} else {
    // DOMContentLoaded zaten geçmişse hemen çalıştır
    fetchAndUpdateUserInfo();
}
