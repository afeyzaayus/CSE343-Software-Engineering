import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export async function registerUserService(userData) {
    const { full_name, email, phone_number, password, site_id, block_no, apartment_no } = userData;

    // 1. Site Kontrolü: site_id ile Site modelindeki benzersiz 'site_id' alanını ara
    const site = await prisma.site.findUnique({ 
        where: { site_id: site_id } // site_id alanını kullanıyoruz
    });

    if (!site) {
        // Eğer belirtilen site_id ile eşleşen bir site yoksa hata fırlat
        throw new Error('USER_ERROR: Belirtilen Site ID bulunamadı.');
    }
    
    // 2. E-posta Çakışması Kontrolü
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('AUTH_ERROR: Bu e-posta adresi zaten kayıtlı.');
    }

    // 3. Şifreyi Hash'leme (SALT_ROUNDS'un erişilebilir olması gerekir)
    const hashedPassword = await bcrypt.hash(password, 10); // 10, SALT_ROUNDS yerine örnek değer

    // 4. Yeni Kullanıcı Oluşturma
    const newUser = await prisma.user.create({
        data: {
            full_name,
            email,
            phone_number,
            password: hashedPassword,
            // DOĞRU BAĞLANTI: Bulunan Site nesnesinin kendi ID'sini (site.id) kullan
            siteId: site.id, 
            block_no,
            apartment_no,
        },
        select: {
            id: true,
            full_name: true,
            email: true,
            siteId: true,
            block_no: true,
            apartment_no: true,
        }
    });

    return newUser;
}

// ===== KULLANICI GİRİŞİ (TELEFON VE ŞİFRE İLE) =====
export async function loginUserService(loginData) {
    const { phone_number, password } = loginData;

    // 1. Telefon Numarası ile Kullanıcıyı Bulma
    const user = await prisma.user.findUnique({
        where: { phone_number },
        // Şifre kontrolü için şifreyi de çekmek gerekiyor
        select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true,
            password: true, // Şifreyi çek
            siteId: true,
            block_no: true,
            apartment_no: true,
        }
    });

    if (!user) {
        // Kullanıcı bulunamazsa
        throw new Error('AUTH_ERROR: Telefon numarası veya şifre hatalı.');
    }

    // 2. Şifre Kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        // Şifre eşleşmezse
        throw new Error('AUTH_ERROR: Telefon numarası veya şifre hatalı.');
    }

    // 3. Başarılı Giriş (Hassas şifre bilgisini döndürmeden)
    // Şifre alanını çıkartarak döndür
    const { password: _, ...userData } = user; 
    return userData;
}


// ===== YÖNETİCİ KAYDI =====
export async function registerAdminService(adminData) {
    const { full_name, email, password, account_type, company_name } = adminData;

    // 1. E-posta Çakışması Kontrolü
    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
        throw new Error('AUTH_ERROR: Bu e-posta adresi zaten kayıtlı.');
    }

    // 2. Şifreyi Hash'leme
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Admin Kaydı Oluşturma
    const newAdmin = await prisma.admin.create({
        data: {
            full_name,
            email,
            password: hashedPassword,
            account_type,
            company_name: account_type === 'COMPANY' ? company_name : null,
        },
        select: {
            id: true,
            full_name: true,
            email: true,
            account_type: true,
            company_name: true,
        }
    });

    return newAdmin;
}
// ===== YÖNETİCİ GİRİŞİ (E-POSTA VE ŞİFRE İLE) =====
export async function loginAdminService(loginData) {
    const { email, password } = loginData;

    // 1. E-posta ile Yöneticiyi Bulma
    const admin = await prisma.admin.findUnique({
        where: { email },
        // Şifre kontrolü için şifreyi de çekmek gerekiyor
        select: {
            id: true,
            full_name: true,
            email: true,
            password: true, // Şifreyi çek
            account_type: true,
            company_name: true,
        }
    });

    if (!admin) {
        // Yönetici bulunamazsa
        throw new Error('AUTH_ERROR: E-posta veya şifre hatalı.');
    }

    // 2. Şifre Kontrolü
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
        // Şifre eşleşmezse
        throw new Error('AUTH_ERROR: E-posta veya şifre hatalı.');
    }

    // 3. Başarılı Giriş (Hassas şifre bilgisini döndürmeden)
    // Şifre alanını çıkartarak döndür
    const { password: _, ...adminData } = admin;
    return adminData;
}

export async function createSiteService(adminId, siteData) {
    const { site_id, site_name, site_address } = siteData;

    // 1. site_id benzersizlik kontrolü
    const existingSite = await prisma.site.findUnique({ where: { site_id } });
    if (existingSite) {
        throw new Error('SITE_ERROR: Bu site kimliği (ID) zaten kullanılıyor.');
    }

    // 2. Admin ve Mevcut Sitelerini Alma
    const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        include: { sites_created: true }
    });

    if (!admin) {
        throw new Error('AUTH_ERROR: Admin bulunamadı.');
    }

    const currentSiteCount = admin.sites_created.length;
    let siteLimit = 0;

    // 3. Site Limiti Kontrolü
    if (admin.account_type === 'INDIVIDUAL') {
        siteLimit = 1;
    } else if (admin.account_type === 'COMPANY') {
        siteLimit = 5;
    }

    if (currentSiteCount >= siteLimit) {
        throw new Error(`LIMIT_EXCEEDED: Hesap türünüz (${admin.account_type}) ile en fazla ${siteLimit} site oluşturabilirsiniz. Limitiniz doldu.`);
    }

    // 4. Yeni Site Oluşturma
    const newSite = await prisma.site.create({
        data: {
            site_id,
            site_name,
            site_address,
            adminId: admin.id,
        }
    });

    return newSite;
}

