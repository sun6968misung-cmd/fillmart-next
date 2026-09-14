class CartItem {
  const CartItem({
    required this.productId,
    required this.name,
    required this.taxType,
    required this.price,
    required this.qty,
    this.imageUrl,
  });

  final String productId;
  final String name;
  final String taxType; // 'tax' | 'taxFree'
  final int price;
  final int qty;
  final String? imageUrl;

  CartItem copyWith({int? qty}) => CartItem(
        productId: productId,
        name: name,
        taxType: taxType,
        price: price,
        qty: qty ?? this.qty,
        imageUrl: imageUrl,
      );

  int get total => price * qty;
}
