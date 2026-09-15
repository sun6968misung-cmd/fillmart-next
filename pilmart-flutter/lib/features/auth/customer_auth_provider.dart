import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/api_client.dart';
import '../../core/supabase_client.dart';

final customerAuthProvider = StreamProvider<User?>((ref) {
  return supabase.auth.onAuthStateChange.map((e) => e.session?.user);
});

class AuthNotifier extends StateNotifier<AsyncValue<void>> {
  AuthNotifier() : super(const AsyncValue.data(null));

  String _toEmail(String phone) => '${phone.replaceAll('-', '')}@pilmart.com';

  Future<void> signInWithPhone(String phone, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await supabase.auth.signInWithPassword(
        email: _toEmail(phone),
        password: password,
      );
    });
  }

  Future<void> signUpWithPhone(String phone, String password, String name) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      // Next.js API 경유: admin SDK로 생성 → email 인증 불필요 + profiles row 자동 생성
      final resp = await ApiClient.instance.post('/api/auth/signup', data: {
        'phone': phone,
        'password': password,
        'name': name,
      });
      if (resp.statusCode != 200) {
        throw Exception(resp.data['error'] ?? '회원가입에 실패했습니다.');
      }
      // 가입 완료 후 즉시 로그인
      await supabase.auth.signInWithPassword(
        email: _toEmail(phone),
        password: password,
      );
    });
  }

  Future<void> signOut() async {
    await supabase.auth.signOut();
  }
}

final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<void>>((_) => AuthNotifier());
