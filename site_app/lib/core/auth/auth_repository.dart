import 'package:dio/dio.dart';
import 'package:site_app/core/config.dart';
import 'package:site_app/core/models/user.dart';
import 'package:site_app/core/result.dart';
import 'package:site_app/core/storage/secure_storage.dart';

class AuthRepository {
  AuthRepository(this._dio);
  final Dio _dio;

  /// Kullanıcı girişi
  Future<Result<(String accessToken, String refreshToken, User me)>> login(
    String phoneNumber,
    String password,
  ) async {
    if (AppConfig.useMockApi) {
      // Mock kapalı
    }

    try {
      // 1️⃣ Login isteği
      final res = await _dio.post(
        '/api/auth/user/login',
        data: {'phone_number': phoneNumber, 'password': password},
      );

      // --- DÜZELTME BURADA BAŞLIYOR ---

      // HATA SEBEBİ 1: Backend "token" gönderiyor, biz "accessToken" arıyorduk.
      final access = res.data['token'] as String;

      // HATA SEBEBİ 2: Backend şu an "refreshToken" göndermiyor.
      // Uygulama çökmesin diye şimdilik boş string veriyoruz.
      final refresh = '';

      // OPTİMİZASYON: Backend zaten "user" objesini cevabın içinde gönderiyor.
      // Tekrar GET isteği atıp sunucuyu yormaya gerek yok, gelen veriyi kullanalım.
      final userMap = res.data['user'];
      final me = User.fromJson(userMap);

      // ---------------------------------

      // 3️⃣ Token ve kullanıcı ID’sini kaydet
      await SecureStore.saveTokens(access, refresh);
      await SecureStore.saveUserId(
        me.id.toString(),
      ); // ID int gelebilir, stringe çeviriyoruz

      return Ok((access, refresh, me));
    } on DioException catch (e) {
      return Err(e.response?.data?['message']?.toString() ?? 'Login failed');
    } catch (e) {
      // JSON parse hatası olursa buraya düşer
      return Err("Veri işleme hatası: $e");
    }
  }

  /// Kullanıcı kaydı (register)
  Future<Result<void>> signup({
    required String fullName,
    required String email,
    required String phoneNumber,
    required String password,
    required String siteId,
    String? blockNo,
    String? apartmentNo,
  }) async {
    if (AppConfig.useMockApi) return Ok(null);

    try {
      await _dio.post(
        '/api/auth/user/register',
        data: {
          'full_name': fullName,
          'email': email,
          'phone_number': phoneNumber,
          'password': password,
          'site_id': siteId,
          'block_no': blockNo,
          'apartment_no': apartmentNo,
        },
      );
      return Ok(null);
    } on DioException catch (e) {
      // Backend bazen "error" key’i döner
      final errMsg =
          e.response?.data?['error'] ??
          e.response?.data?['message'] ??
          'Sign up failed';
      return Err(errMsg.toString());
    }
  }

  /// Kullanıcı çıkışı
  Future<void> logout() async {
    try {
      await _dio.post('/api/auth/logout');
    } catch (_) {}
    await SecureStore.clear();
  }

  /// OTP Doğrulama (Kodu gönder)
  Future<Result<void>> verifyOtp({
    required String phoneNumber,
    required String code,
  }) async {
    if (AppConfig.useMockApi) return Ok(null);

    try {
      // Backend'deki endpoint'ine göre burayı düzenle.
      // Genelde /api/auth/verify-otp veya /api/auth/confirm gibidir.
      await _dio.post(
        '//api/auth/user/verify-phone',
        data: {'phone_number': phoneNumber, 'code': code},
      );
      return Ok(null);
    } on DioException catch (e) {
      String errMsg = 'Doğrulama başarısız oldu'; // Varsayılan mesaj
      final data = e.response?.data;

      // 1. Eğer gelen veri bir Map (JSON Objesi) ise:
      if (data is Map<String, dynamic>) {
        errMsg = data['error'] ?? data['message'] ?? errMsg;
      }
      // 2. Eğer gelen veri direkt bir Yazı (String) ise:
      else if (data is String) {
        errMsg = data;
      }
      // 3. Eğer gelen veri bir Liste (Array) ise (Hata burada çıkıyordu):
      else if (data is List && data.isNotEmpty) {
        errMsg = data.first.toString(); // Listenin ilk elemanını al
      }

      return Err(errMsg);
    }
  }

 

  // Şifremi Unuttum (Telefon İle)
  Future<Result<void>> forgotPassword(String phoneNumber) async {
    try {
      await _dio.post('/api/auth/user/forgot-password', 
        data: {'phone_number': phoneNumber}); // JSON key değişti
      return Ok(null);
    } on DioException catch (e) {
       // ... hata kodları aynı ...
       return Err(e.response?.data?['message'] ?? 'Hata');
    }
  }

  // Şifre Sıfırla (Telefon İle)
  Future<Result<void>> resetPassword(String phoneNumber, String code, String newPass) async {
    try {
      await _dio.post('/api/auth/user/reset-password', 
        data: {
            'phone_number': phoneNumber, // JSON key değişti
            'code': code, 
            'newPassword': newPass
        });
      return Ok(null);
    } on DioException catch (e) {
       // ... hata kodları aynı ...
       return Err(e.response?.data?['message'] ?? 'Hata');
    }
  }
}
