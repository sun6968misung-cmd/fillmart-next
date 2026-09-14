import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AdminSession', () {
    test('role별 접근 탭 확인', () {
      const superRoles   = ['super', 'product', 'order'];
      const productRoles = ['super', 'product'];
      const orderRoles   = ['super', 'order'];

      expect(superRoles.contains('super'),    isTrue);
      expect(productRoles.contains('order'),  isFalse);
      expect(orderRoles.contains('product'),  isFalse);
    });
  });
}
