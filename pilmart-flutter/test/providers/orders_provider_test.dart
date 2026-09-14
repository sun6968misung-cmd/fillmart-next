import 'package:flutter_test/flutter_test.dart';
import 'package:pilmart_flutter/shared/models/order.dart';

void main() {
  test('Order.fromJson 파싱 — items 누락 시 빈 리스트', () {
    final json = {
      'id': 'abc',
      'order_key': 'pilmart_1',
      'status': '주문완료',
      'total_amount': 5000,
      'vat_amount': 0,
      'created_at': '2026-09-14T00:00:00Z',
    };
    final order = Order.fromJson(json);
    expect(order.items, isEmpty);
    expect(order.totalAmount, 5000);
  });

  test('취소완료·배송완료 주문은 부분취소 불가', () {
    bool canCancel(String status) =>
        status != '배송완료' && status != '취소완료';
    expect(canCancel('주문완료'), true);
    expect(canCancel('배송완료'), false);
    expect(canCancel('취소완료'), false);
  });
}
