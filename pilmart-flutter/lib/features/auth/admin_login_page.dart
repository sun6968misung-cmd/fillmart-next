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
    // 아이디는 비워두면 최고관리자(__super__) 로그인으로 처리된다 (서버 규칙과 동일).
    if (_pwCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('비밀번호를 입력해주세요')));
      return;
    }
    setState(() => _loading = true);
    try {
      await ref.read(adminSessionProvider.notifier)
          .login(_userCtrl.text.trim(), _pwCtrl.text.trim());
      if (mounted) context.go('/admin/orders');
    } on Exception catch (e) {
      if (mounted) {
        final msg = e.toString().contains('401')
            ? '아이디 또는 비밀번호가 올바르지 않습니다'
            : e.toString().contains('connection')
                ? '서버에 연결할 수 없습니다 (${e.toString().split(':').last.trim()})'
                : '로그인 실패: ${e.toString().replaceAll('Exception: ', '')}';
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(msg), duration: const Duration(seconds: 4)));
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
                decoration: const InputDecoration(
                    labelText: '계정 ID',
                    hintText: '최고관리자는 비워두세요')),
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
