import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kakao_flutter_sdk_user/kakao_flutter_sdk_user.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/supabase_client.dart';

abstract class KakaoAuth {
  static Future<void> signIn(BuildContext context, WidgetRef ref) async {
    try {
      // 1. 카카오 로그인 (앱 설치 여부에 따라 분기)
      if (await isKakaoTalkInstalled()) {
        await UserApi.instance.loginWithKakaoTalk();
      } else {
        await UserApi.instance.loginWithKakaoAccount();
      }

      // 2. 사용자 정보 취득
      final kakaoUser = await UserApi.instance.me();
      final phone = kakaoUser.kakaoAccount?.phoneNumber
              ?.replaceAll(RegExp(r'[^0-9]'), '') ??
          '';
      final kakaoId = kakaoUser.id.toString();
      final name = kakaoUser.kakaoAccount?.name ?? '';

      final email = '$phone@kakao.pilmart.com';
      final password = 'kko_${kakaoId}_pilmart';

      // 3. Supabase signIn → 실패(신규) 시 signUp 후 다시 signIn
      try {
        await supabase.auth.signInWithPassword(email: email, password: password);
      } on AuthException {
        await supabase.auth.signUp(
          email: email,
          password: password,
          data: {'phone': phone, 'name': name, 'provider': 'kakao'},
        );
        await supabase.auth.signInWithPassword(email: email, password: password);
      }

      if (context.mounted) context.go('/home');
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('카카오 로그인 실패: $e')),
        );
      }
    }
  }
}
