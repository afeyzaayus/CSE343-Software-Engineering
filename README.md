# CSE343-Software-Engineering

## Site Yönetim Sistemi - Duyurular Modülü

Bu proje, site yöneticilerinin ve kullanıcılarının duyuruları yönetebileceği bir web uygulamasıdır.

## 🚀 Özellikler

### Duyurular Sistemi
- ✅ Yöneticiler yeni duyuru ekleyebilir
- ✅ Duyurular otomatik olarak aktif/geçmiş olarak ayrılır
- ✅ Yöneticiler duyuruları düzenleyebilir ve silebilir
- ✅ Kullanıcılar duyuruları görüntüleyebilir
- ✅ Tarih bazlı otomatik filtreleme

### Kimlik Doğrulama
- Admin ve kullanıcı kaydı
- JWT token tabanlı güvenli giriş
- Rol bazlı yetkilendirme (Admin/Kullanıcı)

### Site Yönetimi
- Admin'ler site oluşturabilir
- Bireysel hesaplar: 1 site
- Şirket hesapları: 5 site

## 📋 API Endpoints

### Duyuru API'leri
- `POST /api/sites/{siteId}/announcements` - Yeni duyuru ekle (Yönetici)
- `GET /api/sites/{siteId}/announcements` - Tüm duyuruları listele (Herkes)
- `GET /api/sites/{siteId}/announcements/{announcementId}` - Belirli duyuruyu görüntüle (Herkes)
- `PUT /api/sites/{siteId}/announcements/{announcementId}` - Duyuru güncelle (Yönetici)
- `DELETE /api/sites/{siteId}/announcements/{announcementId}` - Duyuru sil (Yönetici)

### Kimlik Doğrulama API'leri
- `POST /api/auth/admin/register` - Admin kaydı
- `POST /api/auth/admin/login` - Admin girişi
- `POST /api/auth/user/register` - Kullanıcı kaydı
- `POST /api/auth/user/login` - Kullanıcı girişi
- `POST /api/auth/site/create` - Site oluşturma
- `GET /api/auth/site/admin-sites` - Admin'e ait siteleri listele

## 🛠️ Kurulum

### Backend Kurulumu

```bash
cd backend
npm install
```

`.env` dosyasını oluşturun:
```env
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_secret_key"
TOKEN_EXPIRATION="7d"
PORT=3000
```

Veritabanı migration:
```bash
npx prisma migrate dev
npx prisma generate
```

Backend'i başlatın:
```bash
npm start
```

### Frontend Kurulumu

Frontend için basit bir HTTP sunucusu kullanın:

```bash
cd frontend/public
# Python 3 ile:
python -m http.server 8000

# veya Node.js http-server ile:
npx http-server -p 8000
```

Tarayıcınızda `http://localhost:8000` adresini açın.

## 📊 Veritabanı Yapısı

### Announcement Tablosu
- `id` - Benzersiz kimlik
- `title` - Duyuru başlığı
- `content` - Duyuru içeriği
- `start_date` - Başlangıç tarihi
- `end_date` - Bitiş tarihi
- `siteId` - İlişkili site
- `created_at` - Oluşturulma zamanı
- `updated_at` - Güncellenme zamanı

## 🎯 Kullanım

1. **Kayıt Olun**: Admin veya kullanıcı olarak kayıt olun
2. **Giriş Yapın**: Sisteme giriş yapın
3. **Site Seçin**: (Admin ise site oluşturun) Duyurular için bir site seçin
4. **Duyuru Yönetimi**:
   - Admin: Yeni duyuru ekleyin, düzenleyin veya silin
   - Kullanıcı: Aktif ve geçmiş duyuruları görüntüleyin

## 🔒 Güvenlik

- JWT token ile korumalı API endpoint'leri
- Rol bazlı erişim kontrolü
- Şifre hashleme (bcrypt)
- CORS yapılandırması

## 🏗️ Proje Yapısı

```
CSE343-Software-Engineering/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── announcements/
│   │   │   ├── announcementController.js
│   │   │   ├── announcementService.js
│   │   │   └── announcementRoutes.js
│   │   ├── auth/
│   │   │   ├── authController.js
│   │   │   ├── authService.js
│   │   │   ├── authRoutes.js
│   │   │   └── authMiddleware.js
│   │   ├── app.js
│   │   └── prismaClient.js
│   └── package.json
└── frontend/
    └── public/
        ├── index.html
        ├── announcements.html
        ├── css/
        │   ├── style.css
        │   └── announcements.css
        └── js/
            ├── script.js
            └── announcements.js
```

## 📝 Notlar

- Duyurular `end_date` tarihine göre otomatik olarak aktif/geçmiş olarak filtrelenir
- Admin yetkisi gerektiren işlemler JWT token ile korunur
- Site ID'leri benzersiz olmalıdır
- Tarih formatı: ISO 8601 (YYYY-MM-DDTHH:mm:ss)

## 👥 Geliştirici

CSE343 - Software Engineering Course Project