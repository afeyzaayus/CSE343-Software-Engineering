import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Kullanıcı Kaydı için servis fonksiyonu
export const registerUser = async (userData) => {
  const { phone_number, full_name, site_id, block_no, apartment_no, email, password } = userData;

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      full_name,
      phone_number,
      email,
      password: hashedPassword,
      site_id,
      block_no,
      apartment_no,
    },
  });
  return newUser;
};

// Yönetici Kaydı için servis fonksiyonu
export const registerAdmin = async (adminData) => {
  const { email, password, full_name, site_id, account_type } = adminData;

  const hashedPassword = await bcrypt.hash(password, 10);

  const newAdmin = await prisma.admin.create({
    data: {
      email,
      full_name,
      password: hashedPassword,
      site_id,
      account_type,
    },
  });
  return newAdmin;
};