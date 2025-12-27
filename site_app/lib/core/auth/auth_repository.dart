import 'package:dio/dio.dart';
import 'package:site_app/core/models/user.dart';
import 'package:site_app/core/result.dart';
import 'package:site_app/core/storage/secure_storage.dart';

/// Repository responsible for handling network requests related to authentication.
class AuthRepository {
  AuthRepository(this._dio);
  final Dio _dio;

  /// Authenticates the user and retrieves access tokens and user profile.
  ///
  /// Returns a [Result] containing the access token, refresh token, and [User] object.
  Future<Result<(String accessToken, String refreshToken, User me)>> login(
    String phoneNumber,
    String password,
  ) async {
    try {
      final res = await _dio.post(
        '/api/auth/user/login',
        data: {'phone_number': phoneNumber, 'password': password},
      );

      final data = res.data;

      // Normalize response data: Handle cases where data is nested under a 'data' key or flat.
      final responseData =
          (data is Map<String, dynamic> && data.containsKey('data'))
              ? data['data']
              : data;

      final access = responseData['token'] ?? responseData['access_token'] ?? '';
      final refresh = responseData['refresh_token']?.toString() ?? '';

      final userMap = responseData['user'];
      
      // Parse User object safely
      if (userMap == null) {
        return Err("Kullanıcı verisi alınamadı.");
      }
      final me = User.fromJson(userMap);

      if (access.isNotEmpty) {
        // Persist sensitive data securely
        await SecureStore.saveTokens(access, refresh);
        await SecureStore.saveUserId(me.id.toString());
        return Ok((access.toString(), refresh, me));
      } else {
        return Err("Giriş başarılı ancak token alınamadı.");
      }
    } on DioException catch (e) {
      final msg =
          e.response?.data?['message'] ??
          e.response?.data?['error'] ??
          'Giriş başarısız. Lütfen bilgileri kontrol edin.';
      return Err(msg.toString());
    } catch (e) {
      return Err("Bağlantı hatası: $e");
    }
  }

  /// Initiates the signup flow by requesting a verification code (or password setup).
  Future<Result<void>> initiateSignup({
    required String phoneNumber,
    required String siteId,
  }) async {
    try {
      await _dio.post(
        '/api/auth/user/initiate-password-setup',
        data: {'phone_number': phoneNumber, 'site_id': siteId},
      );
      return Ok(null);
    } on DioException catch (e) {
      final errMsg =
          e.response?.data?['error'] ??
          e.response?.data?['message'] ??
          'İşlem başlatılamadı';
      return Err(errMsg.toString());
    } catch (e) {
      return Err("Bağlantı hatası: $e");
    }
  }

  /// Completes the signup flow by verifying the code and setting the password.
  Future<Result<void>> completeSignup({
    required String phoneNumber,
    required String code,
    required String password,
  }) async {
    try {
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
      String errMsg = 'Kayıt tamamlanamadı';
      final data = e.response?.data;

      if (data is Map<String, dynamic>) {
        errMsg = data['error'] ?? data['message'] ?? errMsg;
      } else if (data is String) {
        errMsg = data;
      }
      return Err(errMsg);
    } catch (e) {
      return Err("Bir hata oluştu: $e");
    }
  }

  /// Sends a request to initiate the password recovery process.
  Future<Result<void>> forgotPassword(String phoneNumber) async {
    try {
      await _dio.post(
        '/api/auth/user/forgot-password',
        data: {'phone_number': phoneNumber},
      );
      return Ok(null);
    } on DioException catch (e) {
      return Err(
        e.response?.data?['message'] ??
            'Bu numara kayıtlı değil veya bir hata oluştu.',
      );
    } catch (e) {
      return Err("Bağlantı hatası: $e");
    }
  }

  /// Resets the user's password using the recovery token/code.
  Future<Result<void>> resetPassword(
    String phoneNumber,
    String idToken,
    String newPass,
  ) async {
    try {
      // Note: Reusing the set-password endpoint for reset flow as per backend logic.
      await _dio.post(
        '/api/auth/user/set-password',
        data: {
          'phone_number': phoneNumber,
          'code': idToken,
          'password': newPass,
          'password_confirm': newPass,
        },
      );
      return Ok(null);
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? (e.response?.data['message'] ?? e.response?.data['error'])
          : 'Şifre sıfırlama başarısız.';
      return Err(msg?.toString() ?? 'Hata oluştu');
    } catch (e) {
      return Err("Bağlantı hatası: $e");
    }
  }

  /// Logs out the user by clearing local secure storage.
  /// Note: The backend token invalidation should ideally happen here if supported.
  Future<void> logout() async {
    await SecureStore.clear();
  }
}