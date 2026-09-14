import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';

@pragma('vm:entry-point')
Future<void> _onBackgroundMessage(RemoteMessage message) async {
  debugPrint('[FCM] 백그라운드: ${message.notification?.title}');
}

class FcmService {
  FcmService._();

  static final _messaging = FirebaseMessaging.instance;
  static final _localNotifications = FlutterLocalNotificationsPlugin();

  static const _channel = AndroidNotificationChannel(
    'pilmart_default',
    '필마트 알림',
    description: '필마트 앱 알림',
    importance: Importance.high,
  );

  static Future<void> init() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    debugPrint('[FCM] 권한: ${settings.authorizationStatus}');

    // 로컬 알림 초기화 (포그라운드 메시지 표시용)
    await _localNotifications.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      ),
    );
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);

    FirebaseMessaging.onBackgroundMessage(_onBackgroundMessage);

    // 포그라운드 메시지 → 로컬 알림으로 표시
    FirebaseMessaging.onMessage.listen((message) {
      final n = message.notification;
      if (n == null) return;
      _localNotifications.show(
        message.hashCode,
        n.title,
        n.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channel.id,
            _channel.name,
            channelDescription: _channel.description,
            icon: '@mipmap/ic_launcher',
            importance: Importance.high,
            priority: Priority.high,
          ),
        ),
      );
    });

    final initial = await _messaging.getInitialMessage();
    if (initial != null) {
      debugPrint('[FCM] 초기 메시지: ${initial.data}');
    }

    await _saveToken();
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
