// lib/shared/models/wishlist_item.dart
import 'product.dart';

class WishlistItem {
  final String productId;
  final Product product;

  const WishlistItem({required this.productId, required this.product});

  factory WishlistItem.fromJson(Map<String, dynamic> j) => WishlistItem(
        productId: j['product_id'] as String,
        product: Product.fromJson(j['products'] as Map<String, dynamic>),
      );
}
