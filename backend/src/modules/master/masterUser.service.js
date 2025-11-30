import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

// 1️⃣ Master admin otomatik seed
export async function seedMasterAdmin() {
  const email = process.env.MASTER_ADMIN_EMAIL || 'admin@system.com';
  const password = process.env.MASTER_ADMIN_PASSWORD || 'Admin123!';
  const existingAdmin = await prisma.masterUser.findUnique({ where: { email } });

  if (existingAdmin) return existingAdmin;

  const password_hash = await bcrypt.hash(password, 10);

  const admin = await prisma.masterUser.create({
    data: {
      email,
      full_name: 'Master Admin',
      password_hash,
      master_role: 'MASTER_ADMIN',
      is_active: true,
    },
  });

  console.log('✅ Master admin oluşturuldu:', email);
  return admin;
}

// 2️⃣ Developer davet et
export async function inviteDeveloper(inviterId, devEmail) {
  // Token üret
  const token = crypto.randomBytes(20).toString('hex');

  // Davet kaydı (örnek: basit master_users tablosunda is_active = false)
  const dev = await prisma.masterUser.create({
    data: {
      email: devEmail,
      full_name: 'Bekleyen Developer',
      password_hash: '',
      master_role: 'DEVELOPER',
      is_active: false, // kayıt tamamlanana kadar pasif
    },
  });

  // Bu token'ı ileride e-posta ile gönderebilirsin (şimdilik log)
  console.log(`🔗 Davet linki: http://localhost:3000/master/developer/register?token=${token}`);

  return { dev, token };
}

// 3️⃣ Developer kayıt ol
export async function registerDeveloper(token, full_name, password) {
  // Token doğrulama kısmı: basit örnek olarak email üzerinden
  const dev = await prisma.masterUser.findFirst({ where: { is_active: false } });
  if (!dev) throw new Error('Geçersiz veya kullanılmış davet');

  const password_hash = await bcrypt.hash(password, 10);

  const updatedDev = await prisma.masterUser.update({
    where: { id: dev.id },
    data: { full_name, password_hash, is_active: true },
  });

  return updatedDev;
}

// 4️⃣ Login
export async function loginMaster(email, password) {
  const user = await prisma.masterUser.findUnique({ where: { email } });
  if (!user || !user.is_active) throw new Error('Kullanıcı bulunamadı veya aktif değil');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new Error('Şifre yanlış');

  // Token üretebilirsin (JWT vb.) şimdilik basit object dönüyoruz
  return { id: user.id, email: user.email, role: user.master_role };
}
