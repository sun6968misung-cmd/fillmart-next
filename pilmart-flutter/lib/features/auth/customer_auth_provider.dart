import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/supabase_client.dart';

final customerAuthProvider = StreamProvider<User?>((ref) {
  return supabase.auth.onAuthStateChange.map((e) => e.session?.user);
});

class AuthNotifier extends StateNotifier<AsyncValue<void>> {
  AuthNotifier() : super(const AsyncValue.data(null));

  String _toEmail(String phone) => '$phone@pilmart.com';

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
      await supabase.auth.signUp(
        email: _toEmail(phone),
        password: password,
        data: {'phone': phone, 'name': name, 'provider': 'local'},
      );
    });
  }

  Future<void> signOut() async {
    await supabase.auth.signOut();
  }
}

final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<void>>((_) => AuthNotifier());
