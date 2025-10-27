import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// .env dosyasını yükle
dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================================
// MIDDLEWARE'LER
// ==========================================================

// JSON body parser
app.use(express.json());

// CORS - Tüm kaynaklardan gelen isteklere izin ver
app.use(cors());

// ==========================================================
// ROTA TANIMLARI
// ==========================================================

// Ana rota
app.get('/', (req, res) => {
  res.send('API is running... 🚀');
});

// Auth rotalarını bağla
app.use('/api/auth', authRoutes);

// ==========================================================
// SUNUCUYU BAŞLAT
// ==========================================================

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});