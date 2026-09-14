import 'package:flutter_test/flutter_test.dart';
import 'package:pilmart_flutter/shared/models/profile.dart';

void main() {
  test('Profile.fromJson — business 사용자', () {
    final json = {
      'id': 'uuid-1',
      'phone': '01012345678',
      'name': '홍길동',
      'address': '경북 구미시',
      'provider': 'local',
      'fcm_token': null,
      'user_type': 'business',
    };
    final p = Profile.fromJson(json);
    expect(p.userType, 'business');
    expect(p.phone, '01012345678');
  });
}
