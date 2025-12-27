import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// A utility class for securely persisting sensitive data (Tokens, IDs) locally.
/// Uses the device's Keystore (Android) or Keychain (iOS).
class SecureStore {
  // Private instance of the secure storage plugin
  static const _storage = FlutterSecureStorage();

  // Storage Keys
  static const _kAccess = 'access_token';
  static const _kRefresh = 'refresh_token';
  static const _kUserId  = 'user_id';

  /// Saves the authentication tokens to secure storage.
  static Future<void> saveTokens(String access, String refresh) async {
    await _storage.write(key: _kAccess, value: access);
    await _storage.write(key: _kRefresh, value: refresh);
  }

  /// Retrieves the stored access token.
  static Future<String?> readAccessToken() => _storage.read(key: _kAccess);

  /// Retrieves the stored refresh token.
  static Future<String?> readRefreshToken() => _storage.read(key: _kRefresh);

  /// Saves the current user's ID.
  static Future<void> saveUserId(String id) => _storage.write(key: _kUserId, value: id);

  /// Retrieves the stored user ID.
  static Future<String?> readUserId() => _storage.read(key: _kUserId);

  /// Clears all data from secure storage (used during logout).
  static Future<void> clear() => _storage.deleteAll();
}