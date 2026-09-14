import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'admin_auth_provider.dart';

class AdminLoginPage extends ConsumerStatefulWidget {
  const AdminLoginPage({super.key});
  @override
  ConsumerState<AdminLoginPage> createState() => _AdminLoginPageState();
}

class _AdminLoginPageState extends ConsumerState<AdminLoginPage> {
  final _userCtrl = TextEditingController();
  final _pwCtrl   = TextEditingController();
  bool _loading   = false;

  @override
  void dispose() {
    _userCtrl.dispose();
    _pwCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() => _loading = true);
    try {
      await ref.read(adminSessionProvider.notifier)
          .login(_userCtrl.text.trim(), _pwCtrl.text.trim());
      if (mounted) context.go('/admin/orders');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('관리자 로그인')),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(children: [
            const SizedBox(height: 48),
            TextField(controller: _userCtrl,
                decoration: const InputDecoration(labelText: '계정 ID')),
            const SizedBox(height: 12),
            TextField(controller: _pwCtrl,
                decoration: const InputDecoration(labelText: '비밀번호'),
                obscureText: true),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _login,
              child: _loading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('로그인'),
            ),
          ]),
        ),
      );
}
