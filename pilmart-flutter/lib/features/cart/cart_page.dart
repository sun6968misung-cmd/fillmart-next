import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/features/cart/cart_provider.dart';
import 'package:pilmart_flutter/shared/theme/app_theme.dart';

class CartPage extends ConsumerWidget {
  const CartPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final notifier = ref.read(cartProvider.notifier);

    if (cart.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('장바구니')),
        body: const Center(child: Text('장바구니가 비어있습니다')),
      );
    }

    final taxItems = cart.where((c) => c.taxType == 'tax').toList();
    final taxFreeItems = cart.where((c) => c.taxType == 'taxFree').toList();
    final taxTotal = taxItems.fold(0, (s, c) => s + c.total);
    final taxFreeTotal = taxFreeItems.fold(0, (s, c) => s + c.total);

    return Scaffold(
      appBar: AppBar(
        title: const Text('장바구니'),
        actions: [
          TextButton(
            onPressed: notifier.clear,
            child: const Text('전체삭제', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
      body: ListView.builder(
        itemCount: cart.length,
        itemBuilder: (ctx, i) {
          final item = cart[i];
          return ListTile(
            title: Text(item.name),
            subtitle: Text('${item.price}원 × ${item.qty}개 = ${item.total}원'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.remove),
                  onPressed: () =>
                      notifier.updateQty(item.productId, item.qty - 1),
                ),
                Text('${item.qty}'),
                IconButton(
                  icon: const Icon(Icons.add),
                  onPressed: () =>
                      notifier.updateQty(item.productId, item.qty + 1),
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  onPressed: () => notifier.remove(item.productId),
                ),
              ],
            ),
          );
        },
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (taxFreeTotal > 0)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('면세 합계'),
                    Text('$taxFreeTotal원'),
                  ],
                ),
              if (taxTotal > 0)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('과세 합계'),
                    Text('$taxTotal원'),
                  ],
                ),
              const Divider(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    '총 결제금액',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    '${notifier.totalAmount}원',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(52),
                ),
                onPressed: () {
                  if (supabase.auth.currentUser == null) {
                    context.push('/auth');
                    return;
                  }
                  context.push('/checkout');
                },
                child: const Text('결제하기'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
