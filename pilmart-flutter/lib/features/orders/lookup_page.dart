import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:pilmart_flutter/core/constants.dart';

class _LookupItem {
  final String id, name;
  final int price, qty;

  const _LookupItem(
      {required this.id,
      required this.name,
      required this.price,
      required this.qty});

  factory _LookupItem.fromJson(Map<String, dynamic> j) => _LookupItem(
        id: j['id'] as String? ?? '',
        name: j['name'] as String? ?? '',
        price: (j['price'] as num?)?.toInt() ?? 0,
        qty: (j['qty'] as num?)?.toInt() ?? 1,
      );
}

class _LookupResult {
  final String orderKey, status;
  final String? customerName, deliveryAddress, deliveryMemo, paymentMethod;
  final int totalAmount;
  final List<_LookupItem> items;
  final List<String> cancelledItems;
  final DateTime createdAt;

  const _LookupResult({
    required this.orderKey,
    required this.status,
    this.customerName,
    this.deliveryAddress,
    this.deliveryMemo,
    this.paymentMethod,
    required this.totalAmount,
    required this.items,
    required this.cancelledItems,
    required this.createdAt,
  });

  factory _LookupResult.fromJson(Map<String, dynamic> j) => _LookupResult(
        orderKey: j['order_key'] as String,
        status: j['status'] as String,
        customerName: j['customer_name'] as String?,
        deliveryAddress: j['delivery_address'] as String?,
        deliveryMemo: j['delivery_memo'] as String?,
        paymentMethod: j['payment_method'] as String?,
        totalAmount: (j['total_amount'] as num?)?.toInt() ?? 0,
        items: (j['items'] as List<dynamic>? ?? [])
            .map((e) => _LookupItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        cancelledItems:
            (j['cancelled_items'] as List<dynamic>? ?? []).cast<String>(),
        createdAt: DateTime.parse(j['created_at'] as String),
      );
}

const _statusBg = {
  '주문완료': Color(0xFFEFF6FF),
  '배송준비중': Color(0xFFFFFBEB),
  '배송중': Color(0xFFFFF7ED),
  '배송완료': Color(0xFFF0FDF4),
  '취소완료': Color(0xFFF3F4F6),
  '결제대기': Color(0xFFFEFCE8),
};
const _statusFg = {
  '주문완료': Color(0xFF2563EB),
  '배송준비중': Color(0xFFD97706),
  '배송중': Color(0xFFEA580C),
  '배송완료': Color(0xFF16A34A),
  '취소완료': Color(0xFF9CA3AF),
  '결제대기': Color(0xFFCA8A04),
};

String _fmt(int price) =>
    '${price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}원';

class LookupPage extends StatefulWidget {
  const LookupPage({super.key});

  @override
  State<LookupPage> createState() => _LookupPageState();
}

class _LookupPageState extends State<LookupPage> {
  final _formKey = GlobalKey<FormState>();
  final _orderKeyCtrl = TextEditingController();
  final _phoneLast4Ctrl = TextEditingController();

  bool _loading = false;
  String? _error;
  _LookupResult? _result;
  bool _itemsOpen = true;

  @override
  void dispose() {
    _orderKeyCtrl.dispose();
    _phoneLast4Ctrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
      _result = null;
    });

    try {
      final res = await http.post(
        Uri.parse('${AppConstants.nextJsBaseUrl}/api/orders/lookup'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'order_key': _orderKeyCtrl.text.trim(),
          'phone_last4': _phoneLast4Ctrl.text.trim(),
        }),
      );

      if (res.statusCode == 429) {
        setState(() =>
            _error = '조회 횟수를 초과했습니다. 5분 후 다시 시도해주세요.');
        return;
      }
      if (res.statusCode != 200) {
        setState(() =>
            _error = '주문 정보를 찾을 수 없습니다. 주문번호와 전화번호 끝 4자리를 확인해주세요.');
        return;
      }
      final json = jsonDecode(res.body) as Map<String, dynamic>;
      setState(() {
        _result = _LookupResult.fromJson(json);
        _itemsOpen = true;
      });
    } catch (_) {
      setState(() => _error = '오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('비회원 주문 조회')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextFormField(
                        controller: _orderKeyCtrl,
                        decoration: const InputDecoration(
                          labelText: '주문번호',
                          hintText: 'pilmart_...',
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) => (v == null || v.trim().isEmpty)
                            ? '주문번호를 입력해주세요'
                            : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _phoneLast4Ctrl,
                        decoration: const InputDecoration(
                          labelText: '전화번호 끝 4자리',
                          hintText: '1234',
                          border: OutlineInputBorder(),
                          counterText: '',
                        ),
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly
                        ],
                        maxLength: 4,
                        validator: (v) =>
                            (v == null || v.trim().length != 4)
                                ? '전화번호 끝 4자리를 입력해주세요'
                                : null,
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 8),
                        Text(_error!,
                            style: const TextStyle(
                                color: Colors.red, fontSize: 13)),
                      ],
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: _loading ? null : _submit,
                        icon: _loading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2),
                              )
                            : const Icon(Icons.search),
                        label: Text(_loading ? '조회 중...' : '주문 조회'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (_result != null) _buildResult(_result!),
            const SizedBox(height: 24),
            Center(
              child: GestureDetector(
                onTap: () => context.go('/auth'),
                child: const Text.rich(
                  TextSpan(
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                    children: [
                      TextSpan(text: '회원이신가요? '),
                      TextSpan(
                        text: '로그인',
                        style: TextStyle(
                          color: Color(0xFF1a3d8f),
                          decoration: TextDecoration.underline,
                        ),
                      ),
                      TextSpan(text: '하시면 모든 주문 내역을 확인하실 수 있습니다.'),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResult(_LookupResult r) {
    final cancelled = r.cancelledItems.toSet();
    final allCancelled =
        r.items.isNotEmpty && r.items.every((i) => cancelled.contains(i.id));
    final cancelledAmt = r.items
        .where((i) => cancelled.contains(i.id))
        .fold(0, (s, i) => s + i.price * i.qty);
    final originalAmt =
        r.items.fold(0, (s, i) => s + i.price * i.qty);

    final statusBg = _statusBg[r.status] ?? const Color(0xFFF3F4F6);
    final statusFg = _statusFg[r.status] ?? const Color(0xFF9CA3AF);
    final dt = r.createdAt.toLocal();

    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Card(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              '${dt.year}년 ${dt.month}월 ${dt.day}일',
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: statusBg,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                    color:
                                        statusFg.withValues(alpha: 0.3)),
                              ),
                              child: Text(r.status,
                                  style: TextStyle(
                                      color: statusFg,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(r.orderKey,
                            style: const TextStyle(
                                fontSize: 11, color: Colors.grey)),
                      ],
                    ),
                  ),
                  Text(
                    _fmt(r.totalAmount),
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      color: allCancelled
                          ? Colors.grey[300]
                          : const Color(0xFF1a3d8f),
                      decoration: allCancelled
                          ? TextDecoration.lineThrough
                          : null,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            InkWell(
              onTap: () => setState(() => _itemsOpen = !_itemsOpen),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 10),
                child: Row(
                  children: [
                    const Icon(Icons.inventory_2_outlined,
                        size: 16, color: Colors.grey),
                    const SizedBox(width: 6),
                    Text('상품 ${r.items.length}개',
                        style: const TextStyle(
                            fontSize: 13, color: Colors.grey)),
                    const Spacer(),
                    Icon(
                        _itemsOpen
                            ? Icons.keyboard_arrow_up
                            : Icons.keyboard_arrow_down,
                        size: 18,
                        color: Colors.grey),
                  ],
                ),
              ),
            ),
            if (_itemsOpen) ...[
              const Divider(height: 1),
              ...r.items.map((item) {
                final isCancelled = cancelled.contains(item.id);
                return ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 2),
                  title: Text(
                    item.name,
                    style: TextStyle(
                      fontSize: 13,
                      color: isCancelled ? Colors.grey[400] : null,
                      decoration: isCancelled
                          ? TextDecoration.lineThrough
                          : null,
                    ),
                  ),
                  subtitle: Text(
                    '${item.qty}개 · ${_fmt(item.price)} / 개',
                    style: TextStyle(
                        fontSize: 11,
                        color:
                            isCancelled ? Colors.grey[400] : Colors.grey),
                  ),
                  trailing: Text(
                    _fmt(item.price * item.qty),
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: isCancelled ? Colors.grey[400] : null,
                      decoration: isCancelled
                          ? TextDecoration.lineThrough
                          : null,
                    ),
                  ),
                );
              }),
            ],
            Container(
              width: double.infinity,
              color: Colors.grey[50],
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  if (r.paymentMethod != null)
                    _SummaryRow('결제수단', r.paymentMethod!),
                  if (r.deliveryAddress != null &&
                      r.deliveryAddress!.isNotEmpty)
                    _SummaryRow('배송지', r.deliveryAddress!),
                  if (r.deliveryMemo != null && r.deliveryMemo!.isNotEmpty)
                    _SummaryRow('배송 메모', r.deliveryMemo!),
                  if (cancelledAmt > 0) ...[
                    _SummaryRow('상품 금액', _fmt(originalAmt)),
                    _SummaryRow('취소 금액', '– ${_fmt(cancelledAmt)}',
                        color: Colors.red[400]!),
                  ],
                  const Divider(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('최종 결제금액',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 14)),
                      Text(
                        allCancelled
                            ? '0원 (전액 취소)'
                            : _fmt(r.totalAmount),
                        style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF1a3d8f)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label, value;
  final Color? color;
  const _SummaryRow(this.label, this.value, {this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style:
                  const TextStyle(fontSize: 12, color: Colors.grey)),
          Text(value,
              style: TextStyle(fontSize: 12, color: color)),
        ],
      ),
    );
  }
}
