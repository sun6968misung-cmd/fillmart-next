// lib/shared/models/product.dart
class Product {
  final String id, name, category, unit, taxType;
  final int price;
  final String? imageUrl, description;
  final bool isHidden, isFlash;

  const Product({
    required this.id,
    required this.name,
    required this.category,
    required this.unit,
    required this.taxType,
    required this.price,
    this.imageUrl,
    this.description,
    this.isHidden = false,
    this.isFlash = false,
  });

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: j['id'] as String,
        name: j['name'] as String,
        category: j['category'] as String? ?? '',
        unit: j['unit'] as String? ?? '',
        taxType: j['tax_type'] as String? ?? 'taxFree',
        price: (j['price'] as num).toInt(),
        imageUrl: j['image_url'] as String?,
        description: j['description'] as String?,
        isHidden: j['is_hidden'] as bool? ?? false,
        isFlash: j['is_flash'] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'category': category,
        'unit': unit,
        'tax_type': taxType,
        'price': price,
        'image_url': imageUrl,
        'description': description,
        'is_hidden': isHidden,
        'is_flash': isFlash,
      };
}
