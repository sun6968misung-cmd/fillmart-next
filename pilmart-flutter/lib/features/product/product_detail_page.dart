import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/features/home/providers/products_provider.dart';
import 'package:pilmart_flutter/shared/theme/app_theme.dart';

class ProductDetailPage extends ConsumerStatefulWidget {
  const ProductDetailPage({super.key, required this.productId});
  final String productId;

  @override
  ConsumerState<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends ConsumerState<ProductDetailPage> {
  int _qty = 1;
  bool _wishlisted = false;

  @override
  void initState() {
    super.initState();
    _checkWishlist();
  }

  Future<void> _checkWishlist() async {
    final uid = supabase.auth.currentUser?.id;
    if (uid == null) return;
    final rows = await supabase
        .from('wishlists')
        .select()
        .eq('profile_id', uid)
        .eq('product_id', widget.productId);
    if (mounted) setState(() => _wishlisted = (rows as List).isNotEmpty);
  }

  Future<void> _toggleWishlist() async {
    final uid = supabase.auth.currentUser?.id;
    if (uid == null) return;
    if (_wishlisted) {
      await supabase.from('wishlists').delete().match({
        'profile_id': uid,
        'product_id': widget.productId,
      });
    } else {
      await supabase.from('wishlists').upsert({
        'profile_id': uid,
        'product_id': widget.productId,
      });
    }
    if (mounted) setState(() => _wishlisted = !_wishlisted);
  }

  @override
  Widget build(BuildContext context) {
    final asyncProducts = ref.watch(productsProvider);

    return asyncProducts.when(
      data: (products) {
        final product = products.firstWhere(
          (p) => p.id == widget.productId,
          orElse: () => throw Exception('상품 없음'),
        );

        final supplyPrice =
            product.taxType == 'tax' ? (product.price / 1.1).round() : 0;
        final vatAmount =
            product.taxType == 'tax' ? product.price - supplyPrice : 0;

        return Scaffold(
          appBar: AppBar(
            title: Text(product.name),
            actions: [
              IconButton(
                icon: Icon(
                  _wishlisted ? Icons.favorite : Icons.favorite_border,
                  color: AppColors.accent,
                ),
                onPressed: _toggleWishlist,
              ),
            ],
          ),
          body: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 280,
                  width: double.infinity,
                  child: product.imageUrl != null
                      ? CachedNetworkImage(
                          imageUrl: product.imageUrl!,
                          fit: BoxFit.cover,
                        )
                      : Container(
                          color: Colors.grey[100],
                          child: const Icon(
                            Icons.image,
                            size: 80,
                            color: Colors.grey,
                          ),
                        ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product.name,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        product.unit,
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${product.price}원',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      if (product.taxType == 'tax') ...[
                        const SizedBox(height: 4),
                        Text(
                          '공급가: $supplyPrice원  VAT: $vatAmount원',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 12,
                          ),
                        ),
                      ],
                      const Divider(height: 32),
                      Row(
                        children: [
                          const Text(
                            '수량',
                            style: TextStyle(fontSize: 16),
                          ),
                          const Spacer(),
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            onPressed:
                                _qty > 1 ? () => setState(() => _qty--) : null,
                          ),
                          Text(
                            '$_qty',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            onPressed: () => setState(() => _qty++),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          bottomNavigationBar: Padding(
            padding: const EdgeInsets.all(16),
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(52),
              ),
              onPressed: () {
                // Task 4에서 cart_provider 연결 예정
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('${product.name} $_qty개를 장바구니에 담았습니다'),
                  ),
                );
              },
              child: Text('장바구니 담기  |  ${product.price * _qty}원'),
            ),
          ),
        );
      },
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(body: Center(child: Text('오류: $e'))),
    );
  }
}
