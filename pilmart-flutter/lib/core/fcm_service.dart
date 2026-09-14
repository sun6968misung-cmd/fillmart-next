import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';

// 백그라운드 메시지 핸들러 — top-level 함수 필수
@pragma('vm:entry-point')
Future<void> _onBackgroundMessage(RemoteMessage message) async {
  debugPrint('[FCM] 백그라운드: ${message.notification?.title}');
}

class FcmService {
  FcmService._();

  static final _messaging = FirebaseMessaging.instance;

  static Future<void> init() async {
    // 알림 권한 요청
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    debugPrint('[FCM] 권한: ${settings.authorizationStatus}');

    // 백그라운드 핸들러 등록
    FirebaseMessaging.onBackgroundMessage(_onBackgroundMessage);

    // 포그라운드 메시지 수신
    FirebaseMessaging.onMessage.listen((message) {
      debugPrint('[FCM] 포그라운드: ${message.notification?.title} — ${message.notification?.body}');
    });

    // 앱 종료 상태에서 알림 탭으로 실행
    final initial = await _messaging.getInitialMessage();
    if (initial != null) {
      debugPrint('[FCM] 초기 메시지: ${initial.data}');
    }

    // FCM 토큰 획득 및 Supabase 프로필에 저장
    await _saveToken();

    // 토큰 갱신 시 재저장
    _messaging.onTokenRefresh.listen(_updateToken);
  }

  static Future<void> _saveToken() async {
    try {
      final token = await _messaging.getToken();
      if (token == null) return;
      debugPrint('[FCM] 토큰: $token');
      await _updateToken(token);
    } catch (e) {
      debugPrint('[FCM] 토큰 저장 실패: $e');
    }
  }

  static Future<void> _updateToken(String token) async {
    try {
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) return;
      await supabase
          .from('profiles')
          .update({'fcm_token': token})
          .eq('id', userId);
    } catch (e) {
      debugPrint('[FCM] 토큰 업데이트 실패: $e');
    }
  }
}
