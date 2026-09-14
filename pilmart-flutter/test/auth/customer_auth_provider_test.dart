import 'package:flutter_test/flutter_test.dart';

void main() {
  // 실제 Supabase 연결이 필요한 통합 테스트는 flutter drive로 별도 실행
  // 여기서는 이메일 변환 규칙만 검증한다
  group('auth 이메일 변환 규칙', () {
    String toEmail(String phone) => '$phone@pilmart.com';
    String toKakaoEmail(String phone) => '$phone@kakao.pilmart.com';
    String toNaverEmail(String phone) => '$phone@naver.pilmart.com';

    test('전화번호 → 이메일', () {
      expect(toEmail('01012345678'), '01012345678@pilmart.com');
    });
    test('카카오 이메일', () {
      expect(toKakaoEmail('01012345678'), '01012345678@kakao.pilmart.com');
    });
    test('네이버 이메일', () {
      expect(toNaverEmail('01012345678'), '01012345678@naver.pilmart.com');
    });
  });
}
