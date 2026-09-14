import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pilmart_flutter/shared/models/product.dart';
import 'package:pilmart_flutter/shared/widgets/product_card.dart';

class ProductGrid extends StatelessWidget {
  const ProductGrid({super.key, required this.products, this.title});

  final List<Product> products;
  final String? title;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              title!,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.75,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
          ),
          itemCount: products.length,
          itemBuilder: (ctx, i) => ProductCard(
            product: products[i],
            onTap: () => context.push('/product/${products[i].id}'),
          ),
        ),
      ],
    );
  }
}
