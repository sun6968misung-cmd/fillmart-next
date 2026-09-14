import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/api_client.dart';

class _AdminAccount {
  final String id, username, role;
  final bool isActive;

  const _AdminAccount({
    required this.id,
    required this.username,
    required this.role,
    required this.isActive,
  });

  factory _AdminAccount.fromJson(Map<String, dynamic> j) => _AdminAccount(
        id: j['id'] as String,
        username: j['username'] as String,
        role: j['role'] as String,
        isActive: j['is_active'] as bool? ?? true,
      );
}

final _accountsProvider = FutureProvider<List<_AdminAccount>>((ref) async {
  final res = await ApiClient.instance.get('/api/admin/accounts');
  return (res.data as List)
      .map((r) => _AdminAccount.fromJson(r as Map<String, dynamic>))
      .toList();
});

const _roles = ['order', 'product', 'super'];

class AdminAccountsPage extends ConsumerWidget {
  const AdminAccountsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_accountsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('계정 관리'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddDialog(context, ref),
          ),
        ],
      ),
      body: async.when(
        data: (accounts) => accounts.isEmpty
            ? const Center(child: Text('계정이 없습니다'))
            : ListView.builder(
                itemCount: accounts.length,
                itemBuilder: (_, i) {
                  final a = accounts[i];
                  return ListTile(
                    leading: const Icon(Icons.person_outline),
                    title: Text(a.username),
                    subtitle: Text(a.role, style: const TextStyle(fontSize: 12)),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Switch(
                          value: a.isActive,
                          onChanged: (v) =>
                              _toggleActive(context, ref, a.id, v),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline,
                              color: Colors.red),
                          onPressed: () => _delete(context, ref, a.id, a.username),
                        ),
                      ],
                    ),
                  );
                },
              ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('오류: $e')),
      ),
    );
  }

  void _showAddDialog(BuildContext context, WidgetRef ref) {
    final usernameCtrl = TextEditingController();
    final passwordCtrl = TextEditingController();
    String role = 'order';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('계정 추가'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: usernameCtrl,
                decoration: const InputDecoration(labelText: '아이디'),
              ),
              TextField(
                controller: passwordCtrl,
                decoration: const InputDecoration(labelText: '비밀번호 (4자 이상)'),
                obscureText: true,
              ),
              const SizedBox(height: 8),
              InputDecorator(
                decoration: const InputDecoration(labelText: '권한'),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: role,
                    isDense: true,
                    items: _roles
                        .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                        .toList(),
                    onChanged: (v) => setDialogState(() => role = v!),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('취소'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (usernameCtrl.text.isEmpty || passwordCtrl.text.length < 4) {
                  return;
                }
                try {
                  await ApiClient.instance.post('/api/admin/accounts', data: {
                    'username': usernameCtrl.text,
                    'password': passwordCtrl.text,
                    'role': role,
                  });
                  ref.invalidate(_accountsProvider);
                  if (ctx.mounted) Navigator.pop(ctx);
                } catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx)
                        .showSnackBar(SnackBar(content: Text('오류: $e')));
                  }
                }
              },
              child: const Text('추가'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _toggleActive(
      BuildContext context, WidgetRef ref, String id, bool isActive) async {
    try {
      await ApiClient.instance
          .patch('/api/admin/accounts', data: {'id': id, 'isActive': isActive});
      ref.invalidate(_accountsProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('오류: $e')));
      }
    }
  }

  Future<void> _delete(
      BuildContext context, WidgetRef ref, String id, String username) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('계정 삭제'),
        content: Text('$username 계정을 삭제하시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('취소'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('삭제', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await ApiClient.instance
          .delete('/api/admin/accounts', data: {'id': id});
      ref.invalidate(_accountsProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('오류: $e')));
      }
    }
  }
}
