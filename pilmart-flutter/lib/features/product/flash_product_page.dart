import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pilmart_flutter/core/api_client.dart';
import 'package:pilmart_flutter/features/cart/cart_provider.dart';
import 'package:pilmart_flutter/shared/models/cart_item.dart';
import 'package:pilmart_flutter/shared/models/flash_sale.dart';

final _flashSaleConfigProvider = FutureProvider<FlashSaleConfig>((ref) async {
  final res = await ApiClient.instance.get('/api/flash-sale');
  return FlashSaleConfig.fromJson(res.data as Map<String, dynamic>);
});

class FlashProductPage extends ConsumerStatefulWidget {
  final int idx;
  const FlashProductPage({super.key, required this.idx});

  @override
  ConsumerState<FlashProductPage> createState() => _FlashProductPageState();
}

class _FlashProductPageState extends ConsumerState<FlashProductPage> {
  int _qty = 1;

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(_flashSaleConfigProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('오늘만 특가')),
      body: async.when(
        data: (cfg) {
          if (widget.idx < 0 || widget.idx >= cfg.products.length) {
            return const Center(child: Text('상품을 찾을 수 없습니다'));
          }
          final p = cfg.products[widget.idx];
          final maxQty = (p.maxPerCustomer != null && p.maxPerCustomer! > 0)
              ? p.maxPerCustomer!
              : 99;

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (p.imageUrl != null)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            p.imageUrl!,
                            width: double.infinity,
                            height: 220,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              height: 220,
                              color: Colors.grey[100],
                              child: const Icon(Icons.image_not_supported,
                                  size: 48),
                            ),
                          ),
                        )
                      else
                        Container(
                          width: double.infinity,
                          height: 220,
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.shopping_basket, size: 64),
                        ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          '⚡ 오늘만 특가',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        p.name,
                        style: const TextStyle(
                            fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${p.price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}원',
                        style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.red),
                      ),
                      if (p.stock != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          '남은 재고: ${p.stock}개',
                          style: const TextStyle(
                              fontSize: 13, color: Colors.grey),
                        ),
                      ],
                      if (maxQty < 99) ...[
                        const SizedBox(height: 4),
                        Text(
                          '1인 구매 한도: $maxQty개',
                          style: const TextStyle(
                              fontSize: 13, color: Colors.orange),
                        ),
                      ],
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          const Text('수량', style: TextStyle(fontSize: 16)),
                          const Spacer(),
                          IconButton(
                            onPressed: _qty > 1
                                ? () => setState(() => _qty--)
                                : null,
                            icon: const Icon(Icons.remove_circle_outline),
                          ),
                          SizedBox(
                            width: 32,
                            child: Text(
                              '$_qty',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontSize: 18),
                            ),
                          ),
                          IconButton(
                            onPressed: _qty < maxQty
                                ? () => setState(() => _qty++)
                                : null,
                            icon: const Icon(Icons.add_circle_outline),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              SafeArea(
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                    ),
                    onPressed: () {
                      ref.read(cartProvider.notifier).add(
                            CartItem(
                              productId: 'flash${widget.idx}',
                              name: p.name,
                              taxType: 'taxFree',
                              price: p.price,
                              qty: _qty,
                              imageUrl: p.imageUrl,
                            ),
                          );
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('${p.name} $_qty개를 담았습니다'),
                          action: SnackBarAction(
                            label: '장바구니',
                            onPressed: () => context.push('/cart'),
                          ),
                        ),
                      );
                    },
                    child: Text(
                      '장바구니 담기  |  ${(p.price * _qty).toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}원',
                    ),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('오류: $e')),
      ),
    );
  }
}
