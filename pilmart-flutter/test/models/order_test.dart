import 'package:flutter_test/flutter_test.dart';
import 'package:pilmart_flutter/shared/models/order.dart';

void main() {
  group('Order', () {
    final json = {
      'id': 'uuid-1',
      'order_key': 'pilmart_abc123',
      'status': '주문완료',
      'user_id': 'user-uuid',
      'customer_name': '홍길동',
      'delivery_address': '경북 구미시',
      'payment_method': '카드',
      'total_amount': 15000,
      'vat_amount': 1364,
      'items': [
        {'id': 'veg1', 'name': '양배추', 'price': 3500, 'qty': 2, 'tax_type': 'taxFree'}
      ],
      'created_at': '2026-09-14T10:00:00Z',
      'cancelled_items': null,
    };

    test('fromJson 파싱', () {
      final o = Order.fromJson(json);
      expect(o.orderKey, 'pilmart_abc123');
      expect(o.items.length, 1);
      expect(o.items.first.qty, 2);
    });
  });
}
