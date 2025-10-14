import { validationResult } from 'express-validator';
import { registerUser, registerAdmin } from '../services/authService.js';

export const userRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const newUser = await registerUser(req.body);
    res.status(201).json({
      message: 'Kullanıcı kaydı başarıyla tamamlandı.',
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
    console.error(error);
  }
};

export const adminRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const newAdmin = await registerAdmin(req.body);
    res.status(201).json({
      message: 'Yönetici kaydı başarıyla tamamlandı.',
      admin: newAdmin,
    });
  } catch (error) {
    res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
    console.error(error);
  }
};