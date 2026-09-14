import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pilmart_flutter/features/home/providers/products_provider.dart';
import 'package:pilmart_flutter/shared/widgets/product_card.dart';

const kCategories = [
  '야채/채소',
  '과일',
  '축산/계란',
  '수산/건어물',
  '라면/면류',
  '유제품/냉장/냉동',
  '캔/통조림',
];

class CategoryPage extends ConsumerStatefulWidget {
  const CategoryPage({super.key, required this.slug});
  final String slug;

  @override
  ConsumerState<CategoryPage> createState() => _CategoryPageState();
}

class _CategoryPageState extends ConsumerState<CategoryPage> {
  late String _selected;

  @override
  void initState() {
    super.initState();
    _selected =
        kCategories.contains(widget.slug) ? widget.slug : kCategories.first;
  }

  @override
  Widget build(BuildContext context) {
    final asyncProducts = ref.watch(productsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('카테고리')),
      body: Column(
        children: [
          SizedBox(
            height: 48,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              itemCount: kCategories.length,
              itemBuilder: (ctx, i) {
                final cat = kCategories[i];
                return Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                  child: ChoiceChip(
                    label: Text(cat),
                    selected: _selected == cat,
                    onSelected: (_) => setState(() => _selected = cat),
                  ),
                );
              },
            ),
          ),
          Expanded(
            child: asyncProducts.when(
              data: (products) {
                final filtered =
                    products.where((p) => p.category == _selected).toList();
                if (filtered.isEmpty) {
                  return const Center(child: Text('상품이 없습니다'));
                }
                return GridView.builder(
                  padding: const EdgeInsets.all(12),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.75,
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (ctx, i) => ProductCard(
                    product: filtered[i],
                    onTap: () => context.push('/product/${filtered[i].id}'),
                  ),
                );
              },
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('오류: $e')),
            ),
          ),
        ],
      ),
    );
  }
}
