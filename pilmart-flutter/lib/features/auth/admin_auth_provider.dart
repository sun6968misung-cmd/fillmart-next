import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../../core/secure_storage.dart';
import '../../shared/models/admin_session.dart';

class AdminAuthNotifier extends StateNotifier<AdminSession?> {
  final _storage = SecureStorageService();

  AdminAuthNotifier() : super(null) {
    restoreSession();
  }

  Future<void> restoreSession() async {
    final cookie = await _storage.getAdminCookie();
    if (cookie == null) return;
    try {
      final res = await ApiClient.instance.get('/api/admin/session');
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        state = AdminSession(
          username: data['username'] as String,
          role: data['role'] as String,
          cookie: cookie,
        );
      }
    } catch (_) {
      await _storage.deleteAdminCookie();
    }
  }

  Future<void> login(String username, String password) async {
    final res = await ApiClient.instance.post(
      '/api/admin/login',
      data: {'username': username, 'password': password},
      options: Options(validateStatus: (s) => s != null && s < 500),
    );
    if (res.statusCode == 200) {
      final data = res.data as Map<String, dynamic>;
      // Android에서 Set-Cookie 헤더가 Dio에 노출되지 않는 문제 대응:
      // 응답 body의 session_token을 직접 저장
      final tokenFromBody = data['session_token'] as String?;
      if (tokenFromBody != null) {
        await _storage.saveAdminCookie('admin_session=$tokenFromBody');
      }
      final cookie = await _storage.getAdminCookie();
      state = AdminSession(
        username: data['username'] as String? ?? username,
        role: data['role'] as String? ?? 'order',
        cookie: cookie ?? '',
      );
    } else {
      throw Exception('로그인 실패: ${res.statusCode}');
    }
  }

  Future<void> logout() async {
    try {
      await ApiClient.instance.post('/api/admin/logout');
    } catch (_) {}
    await _storage.deleteAdminCookie();
    state = null;
  }
}

final adminSessionProvider =
    StateNotifierProvider<AdminAuthNotifier, AdminSession?>(
        (_) => AdminAuthNotifier());
