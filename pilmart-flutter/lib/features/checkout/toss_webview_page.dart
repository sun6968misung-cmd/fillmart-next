import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

class TossWebViewPage extends StatefulWidget {
  const TossWebViewPage({
    super.key,
    required this.orderId,
    required this.amount,
  });
  final String orderId;
  final int amount;

  @override
  State<TossWebViewPage> createState() => _TossWebViewPageState();
}

class _TossWebViewPageState extends State<TossWebViewPage> {
  late final WebViewController _controller;

  static const _tossClientKey = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eo0';

  String _buildHtml() => '''
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body>
<script src="https://js.tosspayments.com/v2/standard"></script>
<script>
(async () => {
  const toss = TossPayments('$_tossClientKey');
  const payment = toss.payment({ customerKey: 'ANONYMOUS' });
  await payment.requestPayment({
    method: 'CARD',
    amount: { currency: 'KRW', value: ${widget.amount} },
    orderId: '${widget.orderId}',
    orderName: '필마트 주문',
    successUrl: 'pilmart://success',
    failUrl: 'pilmart://fail',
    card: { useEscrow: false, flowMode: 'DEFAULT', useCardPoint: false, useAppCardOnly: false },
  });
})();
</script>
</body>
</html>
''';

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (req) {
          final url = req.url;
          if (url.startsWith('pilmart://success')) {
            final uri = Uri.parse(
                url.replaceFirst('pilmart://', 'https://pilmart.app/'));
            final paymentKey = uri.queryParameters['paymentKey'] ?? '';
            final amount =
                uri.queryParameters['amount'] ?? widget.amount.toString();
            if (!mounted) return NavigationDecision.prevent;
            context.go(
                '/success?paymentKey=$paymentKey&orderId=${widget.orderId}&amount=$amount');
            return NavigationDecision.prevent;
          }
          if (url.startsWith('pilmart://fail')) {
            if (!mounted) return NavigationDecision.prevent;
            context.pop();
            ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('결제가 취소되었습니다')));
            return NavigationDecision.prevent;
          }
          if (!url.startsWith('http')) return NavigationDecision.prevent;
          return NavigationDecision.navigate;
        },
      ))
      ..loadHtmlString(_buildHtml());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('결제')),
      body: WebViewWidget(controller: _controller),
    );
  }
}
