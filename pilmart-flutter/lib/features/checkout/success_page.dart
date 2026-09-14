import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:pilmart_flutter/core/constants.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/features/cart/cart_provider.dart';
import 'package:pilmart_flutter/shared/theme/app_theme.dart';

class SuccessPage extends ConsumerStatefulWidget {
  const SuccessPage({
    super.key,
    this.paymentKey,
    required this.orderId,
    required this.amount,
    this.method,
  });
  final String? paymentKey;
  final String orderId;
  final String amount;
  final String? method;

  @override
  ConsumerState<SuccessPage> createState() => _SuccessPageState();
}

class _SuccessPageState extends ConsumerState<SuccessPage> {
  bool _loading = true;
  bool _success = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _confirm();
  }

  Future<void> _confirm() async {
    try {
      final body = widget.method != null
          ? {
              'orderId': widget.orderId,
              'method': widget.method,
              'amount': int.tryParse(widget.amount) ?? 0,
            }
          : {
              'orderId': widget.orderId,
              'paymentKey': widget.paymentKey,
              'amount': int.tryParse(widget.amount) ?? 0,
            };

      final res = await http.post(
        Uri.parse('${AppConstants.nextJsBaseUrl}/api/payments/confirm'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );

      if (!mounted) return;
      if (res.statusCode == 200) {
        ref.read(cartProvider.notifier).clear();
        setState(() {
          _loading = false;
          _success = true;
        });
      } else {
        setState(() {
          _loading = false;
          _error = '결제 확인 실패 (${res.statusCode})';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = '오류: $e';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('결제 확인 중...'),
            ],
          ),
        ),
      );
    }

    if (!_success) {
      return Scaffold(
        appBar: AppBar(title: const Text('결제 오류')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(_error, textAlign: TextAlign.center),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => context.go('/home'),
                child: const Text('홈으로'),
              ),
            ],
          ),
        ),
      );
    }

    final isLoggedIn = supabase.auth.currentUser != null;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.check_circle,
                  size: 80,
                  color: AppColors.primary,
                ),
                const SizedBox(height: 16),
                const Text(
                  '결제 완료!',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '주문번호: ${widget.orderId}',
                  style: TextStyle(color: Colors.grey[600]),
                ),
                const SizedBox(height: 32),
                if (isLoggedIn)
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(52),
                    ),
                    onPressed: () => context.go('/orders'),
                    child: const Text('주문내역 보기'),
                  )
                else ...[
                  const Text(
                    '비회원 주문내역은 아래에서 확인하세요',
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: () => context.go('/orders/lookup'),
                    child: const Text('주문 조회'),
                  ),
                ],
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => context.go('/home'),
                  child: const Text('홈으로'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
