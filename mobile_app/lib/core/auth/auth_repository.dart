import 'package:dio/dio.dart';
import 'package:site_app/core/config.dart';
import 'package:site_app/core/models/user.dart';
import 'package:site_app/core/result.dart';
import 'package:site_app/core/storage/secure_storage.dart';

class AuthRepository {
  AuthRepository(this._dio);
  final Dio _dio;

  Future<Result<(String accessToken, String refreshToken, User me)>> login(
      String email, String password) async {
    if (AppConfig.useMockApi) { /* ...mock kapalı, atla... */ }
    try {
      // 1) login
      final res = await _dio.post('/api/auth/user/login',
          data: {'email': email, 'password': password});
      final access = res.data['accessToken'] as String;
      final refresh = res.data['refreshToken'] as String;
      final userId = (res.data['userId'] ?? res.data['id'] ?? '').toString();

      // 2) me (profil)
      final meRes = await _dio.get('/api/users/$userId');
      final me = User.fromJson(meRes.data);

      // sakla (controller da saklayabilir ama burada da saklamak pratik)
      await SecureStore.saveTokens(access, refresh);
      await SecureStore.saveUserId(me.id);
      return Ok((access, refresh, me));
    } on DioException catch (e) {
      return Err(e.response?.data?['message']?.toString() ?? 'Login failed');
    }
  }

  Future<Result<void>> signup({
    required String name,
    required String surname,
    required String email,
    required String password,
    required String siteCode,
  }) async {
    if (AppConfig.useMockApi) return Ok(null);
    try {
      await _dio.post('/api/auth/user/register', data: {
        'name': '$name $surname',
        'email': email,
        'password': password,
        'siteCode': siteCode,
      });
      return Ok(null);
    } on DioException catch (e) {
      return Err(e.response?.data?['message']?.toString() ?? 'Sign up failed');
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post('/api/auth/logout');
    } catch (_) {}
    await SecureStore.clear();
  }
}
