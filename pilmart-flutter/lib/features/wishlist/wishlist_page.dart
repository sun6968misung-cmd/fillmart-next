import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pilmart_flutter/features/home/providers/products_provider.dart';
import 'package:pilmart_flutter/features/wishlist/wishlist_provider.dart';
import 'package:pilmart_flutter/shared/widgets/product_card.dart';

class WishlistPage extends ConsumerWidget {
  const WishlistPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncIds = ref.watch(wishlistIdsProvider);
    final asyncProducts = ref.watch(productsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('찜 목록')),
      body: asyncIds.when(
        data: (ids) {
          if (ids.isEmpty) {
            return const Center(child: Text('찜한 상품이 없습니다'));
          }
          return asyncProducts.when(
            data: (products) {
              final wishlisted =
                  products.where((p) => ids.contains(p.id)).toList();
              if (wishlisted.isEmpty) {
                return const Center(child: Text('찜한 상품이 없습니다'));
              }
              return GridView.builder(
                padding: const EdgeInsets.all(12),
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.75,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemCount: wishlisted.length,
                itemBuilder: (ctx, i) => ProductCard(
                  product: wishlisted[i],
                  onTap: () => context.push('/product/${wishlisted[i].id}'),
                ),
              );
            },
            loading: () =>
                const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('오류: $e')),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('오류: $e')),
      ),
    );
  }
}
