import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kakao_flutter_sdk_user/kakao_flutter_sdk_user.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/constants.dart';
import 'core/fcm_service.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: AppConstants.supabaseUrl,
    // ignore: deprecated_member_use
    anonKey: AppConstants.supabaseAnonKey,
  );

  KakaoSdk.init(nativeAppKey: AppConstants.kakaoAppKey);

  // Firebase + FCM 초기화 (google-services.json 필요)
  try {
    await Firebase.initializeApp();
    await FcmService.init();
  } catch (e) {
    debugPrint('[FCM] 초기화 건너뜀 (google-services.json 미설정): $e');
  }

  runApp(const ProviderScope(child: PilmartApp()));
}
