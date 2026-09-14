// lib/core/secure_storage.dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _instance = SecureStorageService._();
  factory SecureStorageService() => _instance;
  const SecureStorageService._();

  final _storage = const FlutterSecureStorage();
  static const _adminCookieKey = 'admin_session_cookie';

  Future<void> saveAdminCookie(String cookie) =>
      _storage.write(key: _adminCookieKey, value: cookie);

  Future<String?> getAdminCookie() => _storage.read(key: _adminCookieKey);

  Future<void> deleteAdminCookie() => _storage.delete(key: _adminCookieKey);
}
