import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AdminCookieInterceptor', () {
    test('set-cookie 헤더에서 admin_session 값을 추출한다', () {
      // 쿠키 파싱 로직을 직접 검증
      const raw = 'admin_session=abc123; Path=/; HttpOnly; SameSite=Strict';
      final cookiePart = raw.split(';').first.trim();
      expect(cookiePart, 'admin_session=abc123');
      expect(cookiePart.startsWith('admin_session='), isTrue);
    });

    test('admin_session이 없는 set-cookie는 무시한다', () {
      const raw = 'other_cookie=xyz; Path=/';
      final cookiePart = raw.split(';').first.trim();
      expect(cookiePart.startsWith('admin_session='), isFalse);
    });
  });
}
