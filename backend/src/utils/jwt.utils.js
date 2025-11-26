import jwt from 'jsonwebtoken';

/**
 * JWT Token oluşturma
 * @param {Object} payload - Token içinde saklanacak veri
 * @param {String} expiresIn - Token süresi (default: 7 gün)
 * @returns {String} JWT token
 */
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

/**
 * JWT Token doğrulama
 * @param {String} token - Doğrulanacak token
 * @returns {Object} Decoded token payload
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Geçersiz veya süresi dolmuş token.');
  }
}

/**
 * Token'dan kullanıcı ID'si alma
 * @param {String} token - JWT token
 * @returns {String|Number} User ID
 */
export function getUserIdFromToken(token) {
  const decoded = verifyToken(token);
  return decoded.id;
}