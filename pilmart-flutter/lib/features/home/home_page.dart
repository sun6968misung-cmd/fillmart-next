import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/features/home/providers/products_provider.dart';
import 'widgets/hero_banner.dart';
import 'widgets/flash_sale_section.dart';
import 'widgets/product_grid.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncProducts = ref.watch(productsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('필마트'),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: () {}),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(productsProvider.future),
        child: CustomScrollView(
          slivers: [
            const SliverToBoxAdapter(child: HeroBanner()),
            const SliverToBoxAdapter(child: FlashSaleSection()),
            asyncProducts.when(
              data: (products) => SliverToBoxAdapter(
                child: ProductGrid(products: products, title: '전체 상품'),
              ),
              loading: () => const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(child: CircularProgressIndicator()),
                ),
              ),
              error: (e, _) => SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(40),
                  child: Center(child: Text('오류: $e')),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
