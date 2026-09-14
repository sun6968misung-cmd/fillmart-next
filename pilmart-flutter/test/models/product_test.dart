import 'package:flutter_test/flutter_test.dart';
import 'package:pilmart_flutter/shared/models/product.dart';

void main() {
  group('Product', () {
    const json = {
      'id': 'veg1',
      'name': '양배추 1통',
      'category': '야채/채소',
      'unit': '1통',
      'tax_type': 'taxFree',
      'price': 3500,
      'image_url': null,
      'description': '아삭한 국산 양배추.',
      'is_hidden': false,
      'is_flash': false,
    };

    test('fromJson 파싱', () {
      final p = Product.fromJson(json);
      expect(p.id, 'veg1');
      expect(p.price, 3500);
      expect(p.taxType, 'taxFree');
      expect(p.isHidden, false);
    });

    test('toJson 직렬화', () {
      final p = Product.fromJson(json);
      final out = p.toJson();
      expect(out['id'], 'veg1');
      expect(out['tax_type'], 'taxFree');
    });
  });
}
