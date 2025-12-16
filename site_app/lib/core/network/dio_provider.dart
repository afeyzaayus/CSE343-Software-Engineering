import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config.dart';
import '../storage/secure_storage.dart';
import '../auth/auth_controller.dart'; // AuthController'a erişim gerekebilir veya sadece storage temizlenir

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
      // Eğer 401 hatası alırsak (Yetkisiz / Kullanıcı Bulunamadı)
      if (e.response?.statusCode == 401) {
        print("Oturum geçersiz. Token siliniyor...");
        // Token'ı telefondan sil ki uygulama bir sonraki açılışta Login istesin
        await SecureStore.clear(); 
      }
      return handler.next(e);
    },
  ));

  dio.interceptors.add(LogInterceptor(
    request: true,
    requestBody: true,
    responseBody: true,
    responseHeader: false,
  ));
  
  return dio;
});