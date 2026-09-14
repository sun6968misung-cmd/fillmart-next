// lib/shared/models/order.dart
class OrderItem {
  final String id, name, taxType;
  final int price, qty;

  const OrderItem({
    required this.id,
    required this.name,
    required this.price,
    required this.qty,
    required this.taxType,
  });

  factory OrderItem.fromJson(Map<String, dynamic> j) => OrderItem(
        id: j['id'] as String,
        name: j['name'] as String,
        price: (j['price'] as num).toInt(),
        qty: (j['qty'] as num).toInt(),
        taxType: j['tax_type'] as String? ?? 'taxFree',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'price': price,
        'qty': qty,
        'tax_type': taxType,
      };
}

class Order {
  final String id, orderKey, status;
  final String? userId, customerName, deliveryAddress, paymentMethod;
  final int totalAmount, vatAmount;
  final List<OrderItem> items;
  final DateTime createdAt;
  final List<OrderItem>? cancelledItems;

  const Order({
    required this.id,
    required this.orderKey,
    required this.status,
    this.userId,
    this.customerName,
    this.deliveryAddress,
    this.paymentMethod,
    required this.totalAmount,
    required this.vatAmount,
    required this.items,
    required this.createdAt,
    this.cancelledItems,
  });

  factory Order.fromJson(Map<String, dynamic> j) => Order(
        id: j['id'] as String,
        orderKey: j['order_key'] as String,
        status: j['status'] as String,
        userId: j['user_id'] as String?,
        customerName: j['customer_name'] as String?,
        deliveryAddress: j['delivery_address'] as String?,
        paymentMethod: j['payment_method'] as String?,
        totalAmount: (j['total_amount'] as num?)?.toInt() ?? 0,
        vatAmount: (j['vat_amount'] as num?)?.toInt() ?? 0,
        items: (j['items'] as List<dynamic>? ?? [])
            .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        createdAt: DateTime.parse(j['created_at'] as String),
        cancelledItems: (j['cancelled_items'] as List<dynamic>?)
            ?.map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'order_key': orderKey,
        'status': status,
        'user_id': userId,
        'customer_name': customerName,
        'delivery_address': deliveryAddress,
        'payment_method': paymentMethod,
        'total_amount': totalAmount,
        'vat_amount': vatAmount,
        'items': items.map((e) => e.toJson()).toList(),
        'created_at': createdAt.toIso8601String(),
        'cancelled_items': cancelledItems?.map((e) => e.toJson()).toList(),
      };
}
