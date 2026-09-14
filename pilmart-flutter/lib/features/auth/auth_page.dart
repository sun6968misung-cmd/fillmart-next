import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'customer_auth_provider.dart';

class AuthPage extends ConsumerStatefulWidget {
  const AuthPage({super.key});

  @override
  ConsumerState<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends ConsumerState<AuthPage> {
  final _phoneCtrl = TextEditingController();
  final _pwCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  bool _isRegister = false;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _pwCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final phone = _phoneCtrl.text.trim();
    final pw = _pwCtrl.text.trim();
    if (_isRegister) {
      await ref
          .read(authNotifierProvider.notifier)
          .signUpWithPhone(phone, pw, _nameCtrl.text.trim());
    } else {
      await ref
          .read(authNotifierProvider.notifier)
          .signInWithPhone(phone, pw);
    }
    final auth = ref.read(authNotifierProvider);
    if (auth.hasError) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(auth.error.toString())),
        );
      }
    } else {
      if (mounted) context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = ref.watch(authNotifierProvider).isLoading;
    return Scaffold(
      appBar: AppBar(title: const Text('필마트')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 32),
            TextField(
              controller: _phoneCtrl,
              decoration: const InputDecoration(labelText: '전화번호'),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 12),
            if (_isRegister) ...[
              TextField(
                controller: _nameCtrl,
                decoration: const InputDecoration(labelText: '이름'),
              ),
              const SizedBox(height: 12),
            ],
            TextField(
              controller: _pwCtrl,
              decoration: const InputDecoration(labelText: '비밀번호'),
              obscureText: true,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: loading ? null : _submit,
              child: Text(_isRegister ? '회원가입' : '로그인'),
            ),
            TextButton(
              onPressed: () => setState(() => _isRegister = !_isRegister),
              child: Text(_isRegister ? '이미 계정이 있어요' : '회원가입'),
            ),
            const Divider(height: 32),
            OutlinedButton.icon(
              icon: const Icon(Icons.chat_bubble),
              label: const Text('카카오로 시작하기'),
              onPressed: () {}, // Task 6에서 구현
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              icon: const Icon(Icons.search),
              label: const Text('네이버로 시작하기'),
              onPressed: () {}, // Task 6에서 구현
            ),
            const Spacer(),
            TextButton(
              onPressed: () => context.push('/admin/login'),
              child: const Text(
                '관리자 로그인',
                style: TextStyle(fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
