// server.js veya index.js

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// Dosya yolunu güncelledik: authRoutes'un ./auth/authRoutes.js konumunda olduğunu varsayıyoruz
import authRoutes from './auth/authRoutes.js'; 
import announcementRoutes from './announcements/announcementRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import cors from 'cors';

// ES module için __dirname alternatifi
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env dosyasındaki değişkenleri yükle
dotenv.config();

const app = express();
// PORT değişkenini .env dosyasından al, yoksa 3000 kullan
const PORT = process.env.PORT || 3000;

// --- MİDDLEWARE'LER ---

// Gelen isteklerin JSON gövdesini (body) parse etmek için
app.use(express.json());

// Tüm kaynaklardan gelen isteklere izin verir (Geliştirme için önemlidir, CORS hatasını önler)
app.use(cors());

// --- ROTA TANIMLARI ---

// API rotalarını ÖNCE tanımla (öncelik sırası önemli!)
// /api/auth yolu altındaki tüm kimlik doğrulama rotalarını bağla
// Örn: /api/auth/admin/register
app.use('/api/auth', authRoutes);

// /api/sites yolu altındaki tüm duyuru rotalarını bağla
// Örn: /api/sites/{siteId}/announcements
app.use('/api/sites', announcementRoutes);

// /api/payments yolu altındaki tüm ödeme rotalarını bağla
app.use('/api/payments', paymentRoutes);

// Frontend klasörü yolları
const frontPath = path.join(__dirname, '..', '..', 'front');
const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'public');

// Ana sayfa route'u - Front klasöründeki duyurular sayfasına yönlendir (ÖNCE tanımla!)
app.get('/', (req, res) => {
  res.sendFile(path.join(frontPath, 'announcements.html'));
});

// Duyurular sayfası için clean URL (hem .html'li hem .html'siz çalışır)
app.get('/announcements', (req, res) => {
  res.sendFile(path.join(frontPath, 'announcements.html'));
});

// Front klasörünü statik olarak servis et
app.use(express.static(frontPath, { index: false }));

// Tüm diğer route'lar için
app.get('*', (req, res) => {
  // Eğer /api ile başlıyorsa 404 döndür
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ message: 'API endpoint bulunamadı' });
  }
  // Değilse duyurular sayfasını gönder
  res.sendFile(path.join(frontPath, 'announcements.html'));
});

// --- SUNUCUYU BAŞLATMA ---

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🚀`);
});