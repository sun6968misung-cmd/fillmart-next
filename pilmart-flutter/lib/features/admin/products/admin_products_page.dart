import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/api_client.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/shared/models/product.dart';
import 'package:pilmart_flutter/features/home/data/base_products.dart';

final _adminProductsProvider = FutureProvider<List<Product>>((ref) async {
  // 오버라이드 (숨김 포함) + 커스텀 상품 (숨김 포함) 모두 로드
  final overrideRows = await supabase.from('product_overrides').select();
  final customRows = await supabase.from('custom_products').select();

  final overrideMap = <String, Map<String, dynamic>>{
    for (final o in (overrideRows as List))
      o['product_id'] as String: o as Map<String, dynamic>,
  };

  final base = kBaseProducts.map((p) {
    final o = overrideMap[p.id];
    if (o == null) return p;
    return Product(
      id: p.id,
      name: o['name'] as String? ?? p.name,
      category: p.category,
      unit: p.unit,
      taxType: p.taxType,
      price: o['price'] != null ? (o['price'] as num).toInt() : p.price,
      imageUrl: o['image_url'] as String? ?? p.imageUrl,
      description: p.description,
      isHidden: o['is_hidden'] as bool? ?? p.isHidden,
      isFlash: p.isFlash,
    );
  }).toList();

  final customs = (customRows as List)
      .map((c) => Product.fromJson(c as Map<String, dynamic>))
      .toList();

  return [...base, ...customs];
});

class AdminProductsPage extends ConsumerWidget {
  const AdminProductsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_adminProductsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('상품 관리'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(_adminProductsProvider),
          ),
        ],
      ),
      body: async.when(
        data: (products) => ListView.builder(
          itemCount: products.length,
          itemBuilder: (_, i) => _ProductRow(
            product: products[i],
            onToggle: () async {
              await _toggleHidden(context, products[i]);
              ref.invalidate(_adminProductsProvider);
            },
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('오류: $e')),
      ),
    );
  }

  Future<void> _toggleHidden(BuildContext context, Product p) async {
    try {
      final type = p.isHidden ? 'show' : 'hide';
      await ApiClient.instance.delete(
        '/api/products',
        data: {'type': type, 'productId': p.id},
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('오류: $e')));
      }
    }
  }
}

class _ProductRow extends StatelessWidget {
  final Product product;
  final VoidCallback onToggle;

  const _ProductRow({required this.product, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    final p = product;
    return ListTile(
      leading: p.imageUrl != null
          ? ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: Image.network(
                p.imageUrl!,
                width: 48,
                height: 48,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Icon(Icons.image_not_supported),
              ),
            )
          : const Icon(Icons.shopping_basket),
      title: Text(
        p.name,
        style: TextStyle(
          color: p.isHidden ? Colors.grey : null,
          decoration: p.isHidden ? TextDecoration.lineThrough : null,
        ),
      ),
      subtitle: Text(
        '${p.category} · ${p.price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}원',
        style: const TextStyle(fontSize: 12),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (p.isHidden)
            const Chip(
              label: Text('숨김', style: TextStyle(fontSize: 11)),
              padding: EdgeInsets.zero,
            ),
          Switch(
            value: !p.isHidden,
            onChanged: (_) => onToggle(),
          ),
        ],
      ),
    );
  }
}
