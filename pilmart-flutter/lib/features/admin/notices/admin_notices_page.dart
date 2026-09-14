import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/api_client.dart';
import 'package:pilmart_flutter/shared/models/notice.dart';

final _adminNoticesProvider = FutureProvider<List<Notice>>((ref) async {
  final res = await ApiClient.instance.get('/api/notices');
  return (res.data as List)
      .map((r) => Notice.fromJson(r as Map<String, dynamic>))
      .toList();
});

class AdminNoticesPage extends ConsumerWidget {
  const AdminNoticesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_adminNoticesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('공지 관리'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddDialog(context, ref),
          ),
        ],
      ),
      body: async.when(
        data: (notices) => notices.isEmpty
            ? const Center(child: Text('공지가 없습니다'))
            : ListView.builder(
                itemCount: notices.length,
                itemBuilder: (_, i) {
                  final n = notices[i];
                  return ListTile(
                    title: Text(n.title),
                    subtitle: Text(
                      n.createdAt.toLocal().toString().substring(0, 10),
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline, color: Colors.red),
                      onPressed: () => _delete(context, ref, n.id),
                    ),
                    onTap: () => _showDetail(context, n),
                  );
                },
              ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('오류: $e')),
      ),
    );
  }

  void _showDetail(BuildContext context, Notice n) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(n.title),
        content: SingleChildScrollView(child: Text(n.content)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('닫기'),
          ),
        ],
      ),
    );
  }

  void _showAddDialog(BuildContext context, WidgetRef ref) {
    final titleCtrl = TextEditingController();
    final contentCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('공지 추가'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleCtrl,
              decoration: const InputDecoration(labelText: '제목'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: contentCtrl,
              decoration: const InputDecoration(labelText: '내용'),
              maxLines: 4,
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
              if (titleCtrl.text.isEmpty) return;
              try {
                await ApiClient.instance.post('/api/notices', data: {
                  'title': titleCtrl.text,
                  'content': contentCtrl.text,
                });
                ref.invalidate(_adminNoticesProvider);
                if (ctx.mounted) Navigator.pop(ctx);
              } catch (e) {
                if (ctx.mounted) {
                  ScaffoldMessenger.of(ctx)
                      .showSnackBar(SnackBar(content: Text('오류: $e')));
                }
              }
            },
            child: const Text('등록'),
          ),
        ],
      ),
    );
  }

  Future<void> _delete(BuildContext context, WidgetRef ref, String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('공지 삭제'),
        content: const Text('이 공지를 삭제하시겠습니까?'),
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
      await ApiClient.instance.delete('/api/notices', data: {'id': id});
      ref.invalidate(_adminNoticesProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('오류: $e')));
      }
    }
  }
}
