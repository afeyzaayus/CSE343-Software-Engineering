import 'package:dio/dio.dart';
import 'package:site_app/core/config.dart';
import 'package:site_app/core/models/user.dart';
import 'package:site_app/core/result.dart';
import 'package:site_app/core/storage/secure_storage.dart';

class AuthRepository {
  AuthRepository(this._dio);
  final Dio _dio;

  /// Kullanıcı girişi
 /// Kullanıcı girişi
  Future<Result<(String accessToken, String refreshToken, User me)>> login(
    String phoneNumber,
    String password,
  ) async {
    if (AppConfig.useMockApi) {
      // Mock kapalı
    }

    try {
      final res = await _dio.post(
        '/api/auth/user/login',
        data: {'phone_number': phoneNumber, 'password': password},
      );

      // --- DÜZELTME BAŞLANGICI ---
      
      // Backend cevabı { "success": true, "data": { ... } } şeklinde geliyor.
      // Bu yüzden önce "data" katmanına girmemiz lazım.
      
      final responseData = res.data['data']; 

      final access = responseData['token'] as String;
      final refresh = ''; 
      final userMap = responseData['user'];
      final me = User.fromJson(userMap);

      // --- DÜZELTME BİTİŞİ ---

      await SecureStore.saveTokens(access, refresh);
      await SecureStore.saveUserId(me.id.toString());

      return Ok((access, refresh, me));
    } on DioException catch (e) {
      return Err(e.response?.data?['message']?.toString() ?? 'Giriş başarısız');
    } catch (e) {
      // Hata burada yakalanıyor:
      return Err("Veri işleme hatası: $e");
    }
  }

  /// 1. ADIM: Kayıt Başlatma (Sadece Telefon ve Site ID)
  Future<Result<void>> initiateSignup({
    required String phoneNumber,
    required String siteId,
  }) async {
    if (AppConfig.useMockApi) return Ok(null);

    try {
      // DÜZELTİLDİ: Artık backend'deki doğru adrese gidiyor
      await _dio.post(
        '/api/auth/user/initiate-password-setup', 
        data: {
          'phone_number': phoneNumber,
          'site_id': siteId,
        },
      );
      return Ok(null);
    } on DioException catch (e) {
      final errMsg =
          e.response?.data?['error'] ??
          e.response?.data?['message'] ??
          'İşlem başlatılamadı';
      return Err(errMsg.toString());
    }
  }

  /// 2. ADIM: Şifre Belirleme ve Doğrulama
  Future<Result<void>> completeSignup({
    required String phoneNumber,
    required String code,
    required String password,
  }) async {
    if (AppConfig.useMockApi) return Ok(null);

    try {
      // DÜZELTİLDİ: Backend set-password bekliyor
      await _dio.post(
        '/api/auth/user/set-password', 
        data: {
          'phone_number': phoneNumber,
          'code': code,
          'password': password,
          'password_confirm': password,
        },
      );
      return Ok(null);
    } on DioException catch (e) {
      String errMsg = 'Doğrulama başarısız oldu';
      final data = e.response?.data;

      if (data is Map<String, dynamic>) {
        errMsg = data['error'] ?? data['message'] ?? errMsg;
      } else if (data is String) {
        errMsg = data;
      } else if (data is List && data.isNotEmpty) {
        errMsg = data.first.toString();
      }

      return Err(errMsg);
    }
  }

  /// Şifremi Unuttum (Telefon İle)
  Future<Result<void>> forgotPassword(String phoneNumber) async {
    try {
      await _dio.post('/api/auth/user/forgot-password', 
        data: {'phone_number': phoneNumber});
      return Ok(null);
    } on DioException catch (e) {
       return Err(e.response?.data?['message'] ?? 'Hata');
    }
  }

  /// Şifre Sıfırla (Telefon İle)
  Future<Result<void>> resetPassword(String phoneNumber, String code, String newPass) async {
    try {
      await _dio.post('/api/auth/user/reset-password', 
        data: {
            'phone_number': phoneNumber,
            'code': code, 
            'newPassword': newPass
        });
      return Ok(null);
    } on DioException catch (e) {
       return Err(e.response?.data?['message'] ?? 'Hata');
    }
  }

  /// Kullanıcı çıkışı
  Future<void> logout() async {
    try {
      await _dio.post('/api/auth/logout');
    } catch (_) {}
    await SecureStore.clear();
  }
}