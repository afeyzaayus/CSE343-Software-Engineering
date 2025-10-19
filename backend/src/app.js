// server.js veya index.js

import express from 'express';
import dotenv from 'dotenv';
// Dosya yolunu güncelledik: authRoutes'un ./auth/authRoutes.js konumunda olduğunu varsayıyoruz
import authRoutes from './auth/authRoutes.js'; 
import cors from 'cors';

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

// /api/auth yolu altındaki tüm kimlik doğrulama rotalarını bağla
// Örn: /api/auth/admin/register
app.use('/api/auth', authRoutes);

// Ana (root) rota
app.get('/', (req, res) => {
  res.send('API is running...');
});

// --- SUNUCUYU BAŞLATMA ---

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🚀`);
});