import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:http/http.dart' as http;
import '../../core/constants.dart';
import '../../core/supabase_client.dart';

class NaverAuthWebView extends StatefulWidget {
  const NaverAuthWebView({super.key});

  @override
  State<NaverAuthWebView> createState() => _NaverAuthWebViewState();
}

class _NaverAuthWebViewState extends State<NaverAuthWebView> {
  late final WebViewController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (req) {
          if (req.url.startsWith(AppConstants.naverCallbackUrl)) {
            _handleCallback(req.url);
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ))
      ..loadRequest(Uri.parse(
        'https://nid.naver.com/oauth2.0/authorize'
        '?response_type=code'
        '&client_id=${AppConstants.naverClientId}'
        '&redirect_uri=${Uri.encodeComponent(AppConstants.naverCallbackUrl)}'
        '&state=pilmart',
      ));
  }

  Future<void> _handleCallback(String url) async {
    final uri = Uri.parse(url);
    final code = uri.queryParameters['code'] ?? '';

    // 토큰 교환은 Next.js API를 통해 수행 (client_secret 노출 방지)
    // POST /api/auth/naver-token { code } → { phone, naverId, name }
    try {
      final res = await http.post(
        Uri.parse('${AppConstants.nextJsBaseUrl}/api/auth/naver-token'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'code': code}),
      );
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final phone = data['phone'] as String;
      final naverId = data['naverId'] as String;
      final name = data['name'] as String? ?? '';

      final email = '$phone@naver.pilmart.com';
      final password = 'nv_${naverId}_pilmart';

      try {
        await supabase.auth.signInWithPassword(email: email, password: password);
      } on AuthException {
        await supabase.auth.signUp(
          email: email,
          password: password,
          data: {'phone': phone, 'name': name, 'provider': 'naver'},
        );
        await supabase.auth.signInWithPassword(email: email, password: password);
      }

      if (mounted) context.go('/home');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('네이버 로그인 실패: $e')),
        );
        Navigator.pop(context);
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('네이버 로그인')),
        body: WebViewWidget(controller: _ctrl),
      );
}
