import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pilmart_flutter/features/cart/cart_provider.dart';
import 'package:pilmart_flutter/shared/models/cart_item.dart';

void main() {
  ProviderContainer makeContainer() => ProviderContainer();

  test('add — 새 아이템 추가', () {
    final c = makeContainer();
    addTearDown(c.dispose);
    c.read(cartProvider.notifier).add(
          const CartItem(
            productId: '1',
            name: '오이',
            taxType: 'taxFree',
            price: 2500,
            qty: 2,
          ),
        );
    expect(c.read(cartProvider).length, 1);
    expect(c.read(cartProvider).first.qty, 2);
  });

  test('add — 동일 productId는 수량 누적', () {
    final c = makeContainer();
    addTearDown(c.dispose);
    c.read(cartProvider.notifier).add(
          const CartItem(
            productId: '1',
            name: '오이',
            taxType: 'taxFree',
            price: 2500,
            qty: 1,
          ),
        );
    c.read(cartProvider.notifier).add(
          const CartItem(
            productId: '1',
            name: '오이',
            taxType: 'taxFree',
            price: 2500,
            qty: 3,
          ),
        );
    expect(c.read(cartProvider).first.qty, 4);
  });

  test('remove — 아이템 제거', () {
    final c = makeContainer();
    addTearDown(c.dispose);
    c.read(cartProvider.notifier).add(
          const CartItem(
            productId: '1',
            name: '오이',
            taxType: 'taxFree',
            price: 2500,
            qty: 1,
          ),
        );
    c.read(cartProvider.notifier).remove('1');
    expect(c.read(cartProvider), isEmpty);
  });

  test('totalAmount 계산', () {
    final c = makeContainer();
    addTearDown(c.dispose);
    c.read(cartProvider.notifier).add(
          const CartItem(
            productId: '1',
            name: '오이',
            taxType: 'taxFree',
            price: 2500,
            qty: 2,
          ),
        );
    c.read(cartProvider.notifier).add(
          const CartItem(
            productId: '2',
            name: '우유',
            taxType: 'tax',
            price: 3300,
            qty: 1,
          ),
        );
    expect(c.read(cartProvider.notifier).totalAmount, 8300);
  });
}
