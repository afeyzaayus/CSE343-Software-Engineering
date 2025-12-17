/**
 * Telefon numarası format kontrolü
 */
export function validatePhoneNumber(phone_number) {
  if (!/^\+?\d{10,15}$/.test(phone_number)) {
    throw new Error('VALIDATION_ERROR: Geçersiz telefon numarası formatı.');
  }
  return true;
}

/**
 * Şifre uzunluk kontrolü
 */
export function validatePassword(password, minLength = 6) {
  if (password.length < minLength) {
    throw new Error(`VALIDATION_ERROR: Şifre en az ${minLength} karakter olmalıdır.`);
  }
  return true;
}

/**
 * Şifre eşleşme kontrolü
 */
export function validatePasswordMatch(password, password_confirm) {
  if (password !== password_confirm) {
    throw new Error('VALIDATION_ERROR: Şifreler eşleşmiyor.');
  }
  return true;
}

/**
 * Site ID kontrolü
 */
export function validateSiteId(site_id, minLength = 4) {
  if (!site_id || site_id.length < minLength) {
    throw new Error(`VALIDATION_ERROR: Site ID en az ${minLength} karakter olmalıdır.`);
  }
  return true;
}

/**
 * Company code kontrolü
 */
export function validateCompanyCode(company_code, minLength = 4) {
  if (!company_code || company_code.length < minLength) {
    throw new Error(`VALIDATION_ERROR: Şirket kodu en az ${minLength} karakter olmalıdır.`);
  }
  return true;
}

/**
 * Hesap durumu kontrolü
 */
export function validateAccountStatus(status) {
  const validStatuses = ['ACTIVE', 'SUSPENDED', 'DELETED'];
  if (!validStatuses.includes(status)) {
    throw new Error('VALIDATION_ERROR: Geçersiz hesap durumu.');
  }
  return true;
}