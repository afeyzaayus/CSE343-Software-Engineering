import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart'; // Required for kDebugMode
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config.dart';
import '../storage/secure_storage.dart';

/// Provides a configured [Dio] client for making network requests.
///
/// Includes interceptors for:
/// - Injecting the Authentication Bearer Token.
/// - Handling 401 Unauthorized errors globally.
/// - Logging requests/responses (Debug mode only).
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: AppConfig.apiBaseUrl,
    connectTimeout: const Duration(seconds: 20),
    receiveTimeout: const Duration(seconds: 20),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  // Add authentication and error handling interceptors
  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      // Attach the Access Token to the header if it exists
      final token = await SecureStore.readAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      return handler.next(options);
    },
    onError: (e, handler) async {
      // Handle session expiration (Unauthorized)
      if (e.response?.statusCode == 401) {
        // Clear local storage to force a clean state on next launch/check
        await SecureStore.clear();
      }
      return handler.next(e);
    },
  ));

  // Add logging only in Debug mode to prevent sensitive data leaks in Production
  if (kDebugMode) {
    dio.interceptors.add(LogInterceptor(
      request: true,
      requestBody: true,
      responseBody: true,
      responseHeader: false,
      error: true,
    ));
  }
  
  return dio;
});