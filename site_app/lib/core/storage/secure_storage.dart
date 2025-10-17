import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStore {
  static const _s = FlutterSecureStorage();
  static const _kAccess = 'access_token';
  static const _kRefresh = 'refresh_token';
  static const _kUserId  = 'user_id';

  static Future<void> saveTokens(String access, String refresh) async {
    await _s.write(key: _kAccess, value: access);
    await _s.write(key: _kRefresh, value: refresh);
  }

  static Future<String?> readAccessToken() => _s.read(key: _kAccess);
  static Future<String?> readRefreshToken() => _s.read(key: _kRefresh);

  static Future<void> saveUserId(String id) => _s.write(key: _kUserId, value: id);
  static Future<String?> readUserId() => _s.read(key: _kUserId);

  static Future<void> clear() => _s.deleteAll();
}
