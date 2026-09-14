import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/api_client.dart';

class _AuditLog {
  final String id, actor, action, target, detail;
  final DateTime createdAt;

  const _AuditLog({
    required this.id,
    required this.actor,
    required this.action,
    required this.target,
    required this.detail,
    required this.createdAt,
  });

  factory _AuditLog.fromJson(Map<String, dynamic> j) => _AuditLog(
        id: j['id'] as String,
        actor: j['actor'] as String? ?? '',
        action: j['action'] as String? ?? '',
        target: j['target'] as String? ?? '',
        detail: j['detail'] as String? ?? '',
        createdAt: DateTime.parse(j['created_at'] as String),
      );
}

final _logsProvider = FutureProvider<List<_AuditLog>>((ref) async {
  final res = await ApiClient.instance.get('/api/admin/logs');
  return (res.data as List)
      .map((r) => _AuditLog.fromJson(r as Map<String, dynamic>))
      .toList();
});

class AdminLogsPage extends ConsumerWidget {
  const AdminLogsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_logsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('감사 로그'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(_logsProvider),
          ),
        ],
      ),
      body: async.when(
        data: (logs) => logs.isEmpty
            ? const Center(child: Text('로그가 없습니다'))
            : ListView.builder(
                itemCount: logs.length,
                itemBuilder: (_, i) {
                  final log = logs[i];
                  return ListTile(
                    dense: true,
                    title: Row(
                      children: [
                        Text(
                          log.actor,
                          style: const TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 13),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          log.action,
                          style: const TextStyle(fontSize: 13),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            log.target,
                            style: const TextStyle(
                                fontSize: 12, color: Colors.grey),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    subtitle: Text(
                      log.detail.isNotEmpty
                          ? '${log.createdAt.toLocal().toString().substring(0, 16)}  ${log.detail}'
                          : log.createdAt.toLocal().toString().substring(0, 16),
                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                  );
                },
              ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('오류: $e')),
      ),
    );
  }
}
