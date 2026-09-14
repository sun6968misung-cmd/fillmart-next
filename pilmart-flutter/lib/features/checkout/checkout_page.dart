import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:pilmart_flutter/core/constants.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/features/cart/cart_provider.dart';
import 'package:pilmart_flutter/shared/theme/app_theme.dart';

enum _PaymentMethod { card, transfer, meetCard, meetCash }

String _generateOrderKey() {
  final ts = DateTime.now().millisecondsSinceEpoch;
  final rand = Random().nextInt(9000) + 1000;
  return 'pilmart_${ts}_$rand';
}

class CheckoutPage extends ConsumerStatefulWidget {
  const CheckoutPage({super.key});

  @override
  ConsumerState<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends ConsumerState<CheckoutPage> {
  String _address = '';
  String _memo = '';
  _PaymentMethod _method = _PaymentMethod.card;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadAddress();
  }

  Future<void> _loadAddress() async {
    final uid = supabase.auth.currentUser?.id;
    if (uid == null) return;
    final row = await supabase
        .from('profiles')
        .select('address')
        .eq('id', uid)
        .maybeSingle();
    if (mounted && row != null && row['address'] != null) {
      setState(() => _address = row['address'] as String);
    }
  }

  Future<void> _submit() async {
    final cart = ref.read(cartProvider);
    if (cart.isEmpty) return;
    setState(() => _loading = true);

    final uid = supabase.auth.currentUser?.id;
    final notifier = ref.read(cartProvider.notifier);
    final total = notifier.totalAmount;
    final vat = notifier.taxAmount;
    final orderKey = _generateOrderKey();

    try {
      final res = await http.post(
        Uri.parse('${AppConstants.nextJsBaseUrl}/api/orders/pending'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'order_key': orderKey,
          'user_id': uid,
          'items': cart
              .map((c) => {
                    'productId': c.productId,
                    'name': c.name,
                    'taxType': c.taxType,
                    'price': c.price,
                    'qty': c.qty,
                  })
              .toList(),
          'total_amount': total,
          'vat_amount': vat,
          'delivery_address': _address,
          'delivery_memo': _memo,
          'payment_method': switch (_method) {
            _PaymentMethod.card => '카드',
            _PaymentMethod.transfer => '계좌이체',
            _PaymentMethod.meetCard => 'meet-card',
            _PaymentMethod.meetCash => 'meet-cash',
          },
        }),
      );

      if (!mounted) return;
      if (res.statusCode != 200 && res.statusCode != 201) {
        final body = res.body.isNotEmpty ? res.body : '알 수 없는 오류';
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('주문 생성 실패 (${res.statusCode}): $body')));
        return;
      }

      final orderId =
          (jsonDecode(res.body) as Map)['order_id'] as String? ?? '';
      if (orderId.isEmpty) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('주문 ID를 받지 못했습니다')));
        return;
      }

      if (_method == _PaymentMethod.meetCard ||
          _method == _PaymentMethod.meetCash) {
        final meetMethod =
            _method == _PaymentMethod.meetCard ? 'meet-card' : 'meet-cash';
        final confirmRes = await http.post(
          Uri.parse('${AppConstants.nextJsBaseUrl}/api/payments/confirm'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'orderId': orderId,
            'amount': total,
          }),
        );
        if (!mounted) return;
        if (confirmRes.statusCode == 200) {
          notifier.clear();
          context.go(
              '/success?orderId=$orderId&amount=$total&method=$meetMethod');
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('결제 처리 실패 (${confirmRes.statusCode})')));
        }
      } else {
        if (!mounted) return;
        context.push('/checkout/payment?orderId=$orderId&amount=$total');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('오류: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final total = ref.read(cartProvider.notifier).totalAmount;

    return Scaffold(
      appBar: AppBar(title: const Text('결제')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('배송지',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(
              _address.isEmpty ? '마이페이지에서 배송지를 등록해주세요' : _address,
              style: TextStyle(color: Colors.grey[700]),
            ),
            const Divider(height: 32),
            const Text('배송 메모',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            TextField(
              decoration: const InputDecoration(
                hintText: '배송 메모 입력 (선택)',
                border: OutlineInputBorder(),
              ),
              onChanged: (v) => _memo = v,
            ),
            const Divider(height: 32),
            const Text('결제 수단',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            RadioGroup<_PaymentMethod>(
              groupValue: _method,
              onChanged: (v) => setState(() => _method = v!),
              child: const Column(
                children: [
                  RadioListTile<_PaymentMethod>(
                    title: Text('온라인 카드'),
                    value: _PaymentMethod.card,
                  ),
                  RadioListTile<_PaymentMethod>(
                    title: Text('계좌이체'),
                    value: _PaymentMethod.transfer,
                  ),
                  RadioListTile<_PaymentMethod>(
                    title: Text('만나서 카드'),
                    value: _PaymentMethod.meetCard,
                  ),
                  RadioListTile<_PaymentMethod>(
                    title: Text('만나서 현금'),
                    value: _PaymentMethod.meetCash,
                  ),
                ],
              ),
            ),
            const Divider(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('총 결제금액',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Text(
                  '$total원',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16),
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            minimumSize: const Size.fromHeight(52),
          ),
          onPressed: _loading || cart.isEmpty ? null : _submit,
          child: _loading
              ? const CircularProgressIndicator(color: Colors.white)
              : Text('결제하기  |  $total원'),
        ),
      ),
    );
  }
}
