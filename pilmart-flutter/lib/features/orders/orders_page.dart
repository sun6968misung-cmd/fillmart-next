import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/features/orders/orders_provider.dart';
import 'package:pilmart_flutter/shared/models/order.dart';
import 'package:pilmart_flutter/shared/widgets/status_badge.dart';

class OrdersPage extends ConsumerWidget {
  const OrdersPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncOrders = ref.watch(ordersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('주문내역')),
      body: asyncOrders.when(
        data: (orders) {
          if (orders.isEmpty) {
            return const Center(child: Text('주문내역이 없습니다'));
          }
          return ListView.builder(
            itemCount: orders.length,
            itemBuilder: (ctx, i) => _OrderCard(order: orders[i]),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('오류: $e')),
      ),
    );
  }
}

class _OrderCard extends StatefulWidget {
  const _OrderCard({required this.order});
  final Order order;

  @override
  State<_OrderCard> createState() => _OrderCardState();
}

class _OrderCardState extends State<_OrderCard> {
  bool _expanded = false;

  bool get _canCancel =>
      widget.order.status != '배송완료' && widget.order.status != '취소완료';

  Future<void> _cancelItem(OrderItem item) async {
    final cancelled = [...(widget.order.cancelledItems ?? []), item];
    final remaining = widget.order.items
        .where((i) => !cancelled.any((ci) => ci.id == i.id))
        .toList();
    final newTotal = remaining.fold(0, (s, i) => s + i.price * i.qty);
    await supabase.from('orders').update({
      'cancelled_items': cancelled.map((c) => c.toJson()).toList(),
      'total_amount': newTotal,
    }).eq('id', widget.order.id);
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: InkWell(
        onTap: () => setState(() => _expanded = !_expanded),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      o.orderKey,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  StatusBadge(status: o.status),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                '${o.totalAmount}원 · ${o.createdAt.toLocal().toString().substring(0, 10)}',
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
              ),
              if (_expanded) ...[
                const Divider(height: 16),
                ...o.items.map((item) {
                  final cancelled =
                      o.cancelledItems?.any((ci) => ci.id == item.id) ?? false;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      item.name,
                      style: TextStyle(
                        decoration:
                            cancelled ? TextDecoration.lineThrough : null,
                      ),
                    ),
                    subtitle: Text('${item.price}원 × ${item.qty}'),
                    trailing: _canCancel && !cancelled
                        ? TextButton(
                            onPressed: () => _cancelItem(item),
                            child: const Text(
                              '취소',
                              style: TextStyle(color: Colors.red),
                            ),
                          )
                        : null,
                  );
                }),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
