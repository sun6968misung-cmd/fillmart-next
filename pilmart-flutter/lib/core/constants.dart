// lib/core/constants.dart
abstract class AppConstants {
  // --dart-define=SUPABASE_URL=https://... 로 주입
  static const supabaseUrl =
      String.fromEnvironment('SUPABASE_URL', defaultValue: '');
  static const supabaseAnonKey =
      String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: '');
  static const nextJsBaseUrl = String.fromEnvironment('NEXTJS_BASE_URL',
      defaultValue: 'http://10.0.2.2:3000');
  static const kakaoAppKey =
      String.fromEnvironment('KAKAO_APP_KEY', defaultValue: '');
  static const naverClientId =
      String.fromEnvironment('NAVER_CLIENT_ID', defaultValue: '');
  static const naverCallbackUrl = 'pilmart://naver-callback';
}
