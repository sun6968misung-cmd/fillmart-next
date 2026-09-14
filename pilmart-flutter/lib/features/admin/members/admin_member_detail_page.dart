import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pilmart_flutter/core/api_client.dart';
import 'package:pilmart_flutter/shared/models/order.dart';
import 'package:pilmart_flutter/shared/models/profile.dart';

class _DaySummary {
  final String date;
  final int total, orderCount;
  const _DaySummary(
      {required this.date, required this.total, required this.orderCount});
}

class _MemberData {
  final Profile profile;
  final List<Order> orders;
  const _MemberData({required this.profile, required this.orders});

  int get totalSpend => orders.fold(0, (s, o) => s + o.totalAmount);

  List<_DaySummary> get daySummaries {
    final map = <String, _DaySummary>{};
    for (final o in orders) {
      final dt = o.createdAt.toLocal();
      final key =
          '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
      final prev = map[key];
      map[key] = _DaySummary(
        date: key,
        total: (prev?.total ?? 0) + o.totalAmount,
        orderCount: (prev?.orderCount ?? 0) + 1,
      );
    }
    return map.values.toList()..sort((a, b) => b.date.compareTo(a.date));
  }
}

final _memberDataProvider =
    FutureProvider.family<_MemberData, String>((ref, phone) async {
  final membersRes = await ApiClient.instance.get('/api/admin/members');
  final profiles = (membersRes.data as List)
      .map((r) => Profile.fromJson(r as Map<String, dynamic>))
      .toList();
  final profile = profiles.firstWhere(
    (p) => p.phone == phone,
    orElse: () => throw Exception('회원을 찾을 수 없습니다'),
  );

  final ordersRes = await ApiClient.instance.get('/api/admin/orders');
  final memberOrders = (ordersRes.data as List)
      .map((r) => Order.fromJson(r as Map<String, dynamic>))
      .where((o) => o.userId == profile.id)
      .toList()
    ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

  return _MemberData(profile: profile, orders: memberOrders);
});

String _maskPhone(String p) {
  if (p.length >= 10) return '${p.substring(0, 3)}-****-${p.substring(p.length - 4)}';
  return p;
}

String _fmt(int price) =>
    '${price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}원';

const _providerLabel = {'local': '일반', 'kakao': '카카오', 'naver': '네이버'};

class AdminMemberDetailPage extends ConsumerWidget {
  final String phone;
  const AdminMemberDetailPage({super.key, required this.phone});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_memberDataProvider(phone));

    return Scaffold(
      appBar: AppBar(
        title: const Text('회원 상세'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(_memberDataProvider(phone)),
          ),
        ],
      ),
      body: async.when(
        data: (data) => _buildBody(context, data),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('오류: $e')),
      ),
    );
  }

  Widget _buildBody(BuildContext context, _MemberData data) {
    final p = data.profile;
    final days = data.daySummaries;
    final provider = p.provider ?? 'local';

    Color providerBg;
    Color providerFg;
    if (provider == 'kakao') {
      providerBg = const Color(0xFFFEF3C7);
      providerFg = const Color(0xFFB45309);
    } else if (provider == 'naver') {
      providerBg = const Color(0xFFDCFCE7);
      providerFg = const Color(0xFF15803D);
    } else {
      providerBg = const Color(0xFFF3F4F6);
      providerFg = const Color(0xFF6B7280);
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 회원 정보 카드
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(p.name,
                              style: const TextStyle(
                                  fontSize: 17, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 2),
                          Text(_maskPhone(p.phone),
                              style: const TextStyle(
                                  fontSize: 13, color: Colors.grey)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: providerBg,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          _providerLabel[provider] ?? provider,
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: providerFg),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                          child: _StatCard('${data.orders.length}', '총 주문')),
                      const SizedBox(width: 8),
                      Expanded(
                          child: _StatCard('${days.length}', '방문 일수')),
                      const SizedBox(width: 8),
                      Expanded(
                          child: _StatCard(_fmt(data.totalSpend), '누적 결제',
                              small: true)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _InfoRow('회원구분', p.userType == 'business' ? '사업자' : '개인'),
                  if (p.userType == 'business') ...[
                    if (p.businessName != null)
                      _InfoRow('상호명', p.businessName!),
                    if (p.businessNo != null)
                      _InfoRow('사업자번호', p.businessNo!),
                    if (p.businessType != null)
                      _InfoRow('업태', p.businessType!),
                    if (p.businessCategory != null)
                      _InfoRow('업종', p.businessCategory!),
                  ],
                  if (p.address != null && p.address!.isNotEmpty)
                    _InfoRow('주소', p.address!),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text('일자별 주문금액',
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey)),
          const SizedBox(height: 8),
          if (days.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Center(
                    child: Text('주문 내역이 없습니다',
                        style: TextStyle(color: Colors.grey))),
              ),
            )
          else
            Card(
              child: Column(
                children: days.asMap().entries.map((entry) {
                  final i = entry.key;
                  final day = entry.value;
                  final parts = day.date.split('-');
                  final label =
                      '${int.parse(parts[1])}월 ${int.parse(parts[2])}일';
                  return Column(
                    children: [
                      if (i != 0) const Divider(height: 1),
                      ListTile(
                        title: Text(label,
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 14)),
                        subtitle: Text('주문 ${day.orderCount}건',
                            style: const TextStyle(
                                fontSize: 12, color: Colors.grey)),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_fmt(day.total),
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14)),
                            const Icon(Icons.chevron_right,
                                color: Colors.grey, size: 18),
                          ],
                        ),
                        onTap: () => context.go(
                            '/admin/member/${Uri.encodeComponent(phone)}/day/${day.date}'),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value, label;
  final bool small;
  const _StatCard(this.value, this.label, {this.small = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(value,
              style: TextStyle(
                  fontSize: small ? 14 : 20, fontWeight: FontWeight.w900)),
          const SizedBox(height: 2),
          Text(label,
              style: const TextStyle(fontSize: 11, color: Colors.grey)),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label, value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(fontSize: 13, color: Colors.grey)),
          Flexible(
              child: Text(value,
                  style: const TextStyle(fontSize: 13),
                  textAlign: TextAlign.end)),
        ],
      ),
    );
  }
}
