// lib/features/home/providers/products_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/shared/models/product.dart';
import '../data/base_products.dart';

final productsProvider = FutureProvider<List<Product>>((ref) async {
  final overrides = await supabase.from('product_overrides').select();
  final customs = await supabase
      .from('custom_products')
      .select()
      .eq('is_hidden', false);

  final overrideMap = <String, Map<String, dynamic>>{
    for (final o in (overrides as List))
      o['product_id'] as String: o as Map<String, dynamic>,
  };

  final merged = kBaseProducts.map((p) {
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
  }).where((p) => !p.isHidden).toList();

  final customList = (customs as List)
      .map((c) => Product.fromJson(c as Map<String, dynamic>))
      .toList();

  return [...merged, ...customList];
});
