import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/api_client.dart';
import 'package:pilmart_flutter/shared/models/order.dart';
import 'package:pilmart_flutter/shared/widgets/status_badge.dart';

final _adminOrdersProvider = FutureProvider<List<Order>>((ref) async {
  final res = await ApiClient.instance.get('/api/admin/orders');
  return (res.data as List)
      .map((r) => Order.fromJson(r as Map<String, dynamic>))
      .toList();
});

// DB status ↔ display label
const _dbToLabel = {
  '주문완료': '결제완료',
  '배송준비중': '준비중',
  '배송중': '배송중',
  '배송완료': '완료',
  '취소완료': '취소',
};
const _labelToDb = {
  '결제완료': '주문완료',
  '준비중': '배송준비중',
  '배송중': '배송중',
  '완료': '배송완료',
  '취소': '취소완료',
};

class AdminOrdersPage extends ConsumerStatefulWidget {
  const AdminOrdersPage({super.key});

  @override
  ConsumerState<AdminOrdersPage> createState() => _AdminOrdersPageState();
}

class _AdminOrdersPageState extends ConsumerState<AdminOrdersPage> {
  String _filter = '전체';

  static const _filters = ['전체', '결제완료', '준비중', '배송중', '완료', '취소'];

  List<Order> _applyFilter(List<Order> orders) {
    if (_filter == '전체') return orders;
    final dbStatus = _labelToDb[_filter];
    return orders.where((o) => o.status == dbStatus).toList();
  }

  Future<void> _updateStatus(Order order, String newDbStatus) async {
    try {
      await ApiClient.instance.patch('/api/admin/orders', data: {
        'orderId': order.orderKey,
        'status': newDbStatus,
      });
      ref.invalidate(_adminOrdersProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('오류: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(_adminOrdersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('주문 관리'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(_adminOrdersProvider),
          ),
        ],
      ),
      body: async.when(
        data: (orders) {
          final filtered = _applyFilter(orders);
          return Column(
            children: [
              _FilterBar(
                selected: _filter,
                filters: _filters,
                onSelected: (f) => setState(() => _filter = f),
              ),
              Expanded(
                child: filtered.isEmpty
                    ? const Center(child: Text('주문이 없습니다'))
                    : ListView.builder(
                        itemCount: filtered.length,
                        itemBuilder: (_, i) => _OrderCard(
                          order: filtered[i],
                          onStatusChange: _updateStatus,
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

class _FilterBar extends StatelessWidget {
  final String selected;
  final List<String> filters;
  final ValueChanged<String> onSelected;

  const _FilterBar({
    required this.selected,
    required this.filters,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        children: filters
            .map(
              (f) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(f),
                  selected: selected == f,
                  onSelected: (_) => onSelected(f),
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _OrderCard extends StatefulWidget {
  final Order order;
  final Future<void> Function(Order, String) onStatusChange;

  const _OrderCard({required this.order, required this.onStatusChange});

  @override
  State<_OrderCard> createState() => _OrderCardState();
}

class _OrderCardState extends State<_OrderCard> {
  bool _expanded = false;
  bool _saving = false;

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    final displayStatus = _dbToLabel[o.status] ?? o.status;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: Column(
        children: [
          ListTile(
            title: Text(
              o.orderKey,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(o.customerName ?? '비회원', style: const TextStyle(fontSize: 12)),
                Text(
                  o.createdAt.toLocal().toString().substring(0, 16),
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                StatusBadge(status: o.status),
                const SizedBox(width: 8),
                IconButton(
                  icon: Icon(_expanded ? Icons.expand_less : Icons.expand_more),
                  onPressed: () => setState(() => _expanded = !_expanded),
                ),
              ],
            ),
          ),
          if (_expanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (o.deliveryAddress != null)
                    _InfoRow('배송지', o.deliveryAddress!),
                  if (o.paymentMethod != null)
                    _InfoRow('결제', o.paymentMethod!),
                  _InfoRow('합계', '${o.totalAmount.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}원'),
                  const SizedBox(height: 8),
                  ...o.items.map(
                    (item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        children: [
                          Expanded(child: Text(item.name, style: const TextStyle(fontSize: 13))),
                          Text('${item.qty}개', style: const TextStyle(fontSize: 12)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Text('상태 변경:', style: TextStyle(fontSize: 13)),
                      const SizedBox(width: 8),
                      DropdownButton<String>(
                        value: displayStatus,
                        items: _dbToLabel.values
                            .map((label) => DropdownMenuItem(
                                  value: label,
                                  child: Text(label),
                                ))
                            .toList(),
                        onChanged: _saving
                            ? null
                            : (label) async {
                                if (label == null) return;
                                setState(() => _saving = true);
                                await widget.onStatusChange(
                                  o,
                                  _labelToDb[label]!,
                                );
                                if (mounted) setState(() => _saving = false);
                              },
                      ),
                      if (_saving) ...[
                        const SizedBox(width: 8),
                        const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(
            width: 48,
            child: Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }
}
