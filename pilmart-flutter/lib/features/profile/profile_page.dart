import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:webview_flutter/webview_flutter.dart';

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  Map<String, dynamic>? _profile;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final uid = supabase.auth.currentUser?.id;
    if (uid == null) {
      setState(() => _loading = false);
      return;
    }
    final row = await supabase
        .from('profiles')
        .select()
        .eq('id', uid)
        .maybeSingle();
    if (mounted) {
      setState(() {
        _profile = row;
        _loading = false;
      });
    }
  }

  Future<void> _openAddressSearch() async {
    final address = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (_) => const _DaumAddressWebView()),
    );
    if (address == null || !mounted) return;
    final uid = supabase.auth.currentUser?.id;
    if (uid == null) return;
    await supabase
        .from('profiles')
        .update({'address': address})
        .eq('id', uid);
    setState(() => _profile = {...?_profile, 'address': address});
  }

  Future<void> _logout() async {
    await supabase.auth.signOut();
    if (mounted) context.go('/auth');
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final p = _profile;
    return Scaffold(
      appBar: AppBar(title: const Text('마이페이지')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (p != null) ...[
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('이름'),
              subtitle: Text(p['name'] as String? ?? '-'),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('전화번호'),
              subtitle: Text(p['phone'] as String? ?? '-'),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('배송지'),
              subtitle: Text(p['address'] as String? ?? '미설정'),
              trailing: TextButton(
                onPressed: _openAddressSearch,
                child: const Text('변경'),
              ),
            ),
            if (p['user_type'] == 'business') ...[
              const Divider(),
              const Text(
                '사업자 정보',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('사업자번호'),
                subtitle: Text(p['business_no'] as String? ?? '-'),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('상호'),
                subtitle: Text(p['business_name'] as String? ?? '-'),
              ),
            ],
          ],
          const Divider(height: 32),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            onPressed: _logout,
            child: const Text('로그아웃'),
          ),
        ],
      ),
    );
  }
}

class _DaumAddressWebView extends StatefulWidget {
  const _DaumAddressWebView();

  @override
  State<_DaumAddressWebView> createState() => _DaumAddressWebViewState();
}

class _DaumAddressWebViewState extends State<_DaumAddressWebView> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'FlutterAddress',
        onMessageReceived: (msg) {
          if (mounted) Navigator.pop(context, msg.message);
        },
      )
      ..loadHtmlString('''
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body>
<script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
<script>
new daum.Postcode({
  oncomplete: function(data) {
    var addr = data.roadAddress || data.jibunAddress;
    FlutterAddress.postMessage(addr);
  }
}).embed(document.body, { autoClose: false });
</script>
</body>
</html>
''');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('주소 검색')),
      body: WebViewWidget(controller: _controller),
    );
  }
}
