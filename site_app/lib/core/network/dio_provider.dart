import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config.dart';
import '../storage/secure_storage.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: AppConfig.apiBaseUrl,
    connectTimeout: const Duration(seconds: 15),
  ));

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await SecureStore.readAccessToken();
      if (token != null) options.headers['Authorization'] = 'Bearer $token';
      return handler.next(options);
    },
    onError: (e, handler) async {
      // 401 ise refresh dene
      if (e.response?.statusCode == 401) {
        final refresh = await SecureStore.readRefreshToken();
        if (refresh != null) {
          try {
            final r = await dio.post('/api/auth/refresh-token', data: {'refreshToken': refresh});
            final newAccess = r.data['accessToken'] as String?;
            final newRefresh = r.data['refreshToken'] as String? ?? refresh;
            if (newAccess != null) {
              await SecureStore.saveTokens(newAccess, newRefresh);
              // orijinal isteği tekrar dene
              final req = e.requestOptions;
              req.headers['Authorization'] = 'Bearer $newAccess';
              final clone = await dio.fetch(req);
              return handler.resolve(clone);
            }
          } catch (_) { /* fallthrough */ }
        }
      }
      return handler.next(e);
    },
  ));

// --- Log interceptor ---
  dio.interceptors.add(LogInterceptor(
    request: true,
    requestBody: true,
    responseBody: true,
    responseHeader: false,
  ));
  
  return dio;
});
