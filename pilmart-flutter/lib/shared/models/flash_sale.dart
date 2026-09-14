// lib/shared/models/flash_sale.dart
class FlashProduct {
  final String name;
  final int price;
  final int? stock, maxPerCustomer;
  final String? imageUrl;

  const FlashProduct({
    required this.name,
    required this.price,
    this.stock,
    this.maxPerCustomer,
    this.imageUrl,
  });

  factory FlashProduct.fromJson(Map<String, dynamic> j) => FlashProduct(
        name: j['name'] as String,
        price: (j['price'] as num).toInt(),
        stock: (j['stock'] as num?)?.toInt(),
        maxPerCustomer: (j['maxPerCustomer'] as num?)?.toInt(),
        imageUrl: j['imageUrl'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'price': price,
        'stock': stock,
        'maxPerCustomer': maxPerCustomer,
        'imageUrl': imageUrl,
      };
}

class FlashSaleConfig {
  final String? id;
  final int startHour, endHour;
  final bool isActive;
  final List<FlashProduct> products;

  const FlashSaleConfig({
    this.id,
    required this.startHour,
    required this.endHour,
    required this.isActive,
    required this.products,
  });

  factory FlashSaleConfig.fromJson(Map<String, dynamic> j) => FlashSaleConfig(
        id: j['id'] as String?,
        startHour: j['start_hour'] as int? ?? 0,
        endHour: j['end_hour'] as int? ?? 0,
        isActive: j['is_active'] as bool? ?? false,
        products: (j['products'] as List<dynamic>? ?? [])
            .map((e) => FlashProduct.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
