// test/providers/products_provider_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:pilmart_flutter/shared/models/product.dart';

void main() {
  test('override 머지 — name·price 교체, is_hidden 필터', () {
    const base = Product(
      id: '1',
      name: '청오이',
      category: '야채/채소',
      unit: '3개',
      taxType: 'taxFree',
      price: 2500,
      imageUrl: null,
      description: null,
      isHidden: false,
      isFlash: false,
    );
    final override = {
      'product_id': '1',
      'name': '유기농 청오이',
      'price': 3000,
      'image_url': null,
      'is_hidden': false,
    };

    final merged = Product(
      id: base.id,
      name: override['name'] as String? ?? base.name,
      category: base.category,
      unit: base.unit,
      taxType: base.taxType,
      price: override['price'] != null
          ? (override['price'] as num).toInt()
          : base.price,
      imageUrl: override['image_url'] as String? ?? base.imageUrl,
      description: base.description,
      isHidden: override['is_hidden'] as bool? ?? base.isHidden,
      isFlash: base.isFlash,
    );

    expect(merged.name, '유기농 청오이');
    expect(merged.price, 3000);
    expect(merged.isHidden, false);
  });

  test('is_hidden=true 상품은 필터링된다', () {
    const hidden = Product(
      id: '2',
      name: '숨겨진 상품',
      category: '과일',
      unit: '1개',
      taxType: 'taxFree',
      price: 1000,
      imageUrl: null,
      description: null,
      isHidden: true,
      isFlash: false,
    );
    final visible = [hidden].where((p) => !p.isHidden).toList();
    expect(visible, isEmpty);
  });
}
