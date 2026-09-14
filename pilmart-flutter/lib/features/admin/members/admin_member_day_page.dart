import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/api_client.dart';
import 'package:pilmart_flutter/shared/models/order.dart';
import 'package:pilmart_flutter/shared/models/profile.dart';

class _DayData {
  final String memberName;
  final List<Order> orders;
  _DayData({required this.memberName, required this.orders});
}

final _memberDayProvider =
    FutureProvider.family<_DayData, (String, String)>((ref, params) async {
  final (phone, date) = params;

  final membersRes = await ApiClient.instance.get('/api/admin/members');
  final profiles = (membersRes.data as List)
      .map((r) => Profile.fromJson(r as Map<String, dynamic>))
      .toList();
  final profile = profiles.firstWhere(
    (p) => p.phone == phone,
    orElse: () => throw Exception('회원을 찾을 수 없습니다'),
  );

  final ordersRes = await ApiClient.instance.get('/api/admin/orders');
  final dayOrders = (ordersRes.data as List)
      .map((r) => Order.fromJson(r as Map<String, dynamic>))
      .where((o) {
        if (o.userId != profile.id) return false;
        final dt = o.createdAt.toLocal();
        final key =
            '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
        return key == date;
      })
      .toList()
    ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

  return _DayData(memberName: profile.name, orders: dayOrders);
});

const _statusBg = {
  '주문완료': Color(0xFFEFF6FF),
  '배송준비중': Color(0xFFFFFBEB),
  '배송중': Color(0xFFFFF7ED),
  '배송완료': Color(0xFFF0FDF4),
  '취소완료': Color(0xFFF3F4F6),
};
const _statusFg = {
  '주문완료': Color(0xFF2563EB),
  '배송준비중': Color(0xFFD97706),
  '배송중': Color(0xFFEA580C),
  '배송완료': Color(0xFF16A34A),
  '취소완료': Color(0xFF9CA3AF),
};
const _methodLabel = {
  '카드': '온라인 카드',
  '계좌이체': '온라인 계좌이체',
  'meet-card': '만나서(카드)',
  'meet-cash': '만나서(현금)',
};

String _fmt(int price) =>
    '${price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}원';

class AdminMemberDayPage extends ConsumerWidget {
  final String phone, date;
  const AdminMemberDayPage({super.key, required this.phone, required this.date});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_memberDayProvider((phone, date)));

    final parts = date.split('-');
    final title = parts.length == 3
        ? '${int.parse(parts[1])}월 ${int.parse(parts[2])}일 주문'
        : date;

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                ref.invalidate(_memberDayProvider((phone, date))),
          ),
        ],
      ),
      body: async.when(
        data: (data) => _buildBody(data),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('오류: $e')),
      ),
    );
  }

  Widget _buildBody(_DayData data) {
    final orders = data.orders;
    final dayTotal = orders.fold(0, (s, o) => s + o.totalAmount);
    final parts = date.split('-');
    final y = parts[0];
    final m = int.parse(parts[1]);
    final d = int.parse(parts[2]);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('$y년 $m월 $d일',
                        style: const TextStyle(
                            fontSize: 13, color: Colors.grey)),
                    Text(data.memberName,
                        style: const TextStyle(
                            fontSize: 13, color: Colors.grey)),
                    Text('주문 ${orders.length}건',
                        style: const TextStyle(
                            fontSize: 12, color: Colors.grey)),
                  ],
                ),
                Text(_fmt(dayTotal),
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.w900)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        if (orders.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: Center(
                  child: Text('주문 내역이 없습니다',
                      style: TextStyle(color: Colors.grey))),
            ),
          )
        else
          ...orders.map((o) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _OrderCard(order: o),
              )),
      ],
    );
  }
}

class _OrderCard extends StatefulWidget {
  final Order order;
  const _OrderCard({required this.order});

  @override
  State<_OrderCard> createState() => _OrderCardState();
}

class _OrderCardState extends State<_OrderCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    final cancelledIds =
        o.cancelledItems?.map((i) => i.id).toSet() ?? <String>{};
    final allCancelled =
        o.items.isNotEmpty && o.items.every((i) => cancelledIds.contains(i.id));
    final statusLabel = allCancelled ? '취소완료' : o.status;
    final dt = o.createdAt.toLocal();
    final time =
        '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';

    final statusBg = _statusBg[statusLabel] ?? const Color(0xFFF3F4F6);
    final statusFg = _statusFg[statusLabel] ?? const Color(0xFF9CA3AF);

    return Card(
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: statusBg,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(statusLabel,
                                  style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: statusFg)),
                            ),
                            const SizedBox(width: 6),
                            Text(time,
                                style: const TextStyle(
                                    fontSize: 11, color: Colors.grey)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(o.orderKey,
                            style: const TextStyle(
                                fontSize: 11, color: Colors.grey)),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      Text(_fmt(o.totalAmount),
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 14)),
                      Icon(
                          _expanded
                              ? Icons.keyboard_arrow_up
                              : Icons.keyboard_arrow_down,
                          size: 18,
                          color: Colors.grey[400]),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (_expanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  if (o.paymentMethod != null)
                    _Row('결제수단',
                        _methodLabel[o.paymentMethod!] ?? o.paymentMethod!),
                  ...o.items.map((item) {
                    final isCancelled = cancelledIds.contains(item.id);
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              '${item.name} × ${item.qty}',
                              style: TextStyle(
                                fontSize: 13,
                                color: isCancelled ? Colors.grey[400] : null,
                                decoration: isCancelled
                                    ? TextDecoration.lineThrough
                                    : null,
                              ),
                            ),
                          ),
                          Text(
                            _fmt(item.price * item.qty),
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: isCancelled ? Colors.grey[400] : null,
                              decoration: isCancelled
                                  ? TextDecoration.lineThrough
                                  : null,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                  const Divider(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('합계',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 14)),
                      Text(_fmt(o.totalAmount),
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 14)),
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

class _Row extends StatelessWidget {
  final String label, value;
  const _Row(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(
            width: 56,
            child: Text(label,
                style:
                    const TextStyle(fontSize: 12, color: Colors.grey)),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }
}
