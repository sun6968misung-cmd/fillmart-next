import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/shared/models/notice.dart';

final _noticesProvider = FutureProvider<List<Notice>>((ref) async {
  final rows = await supabase
      .from('notices')
      .select()
      .order('created_at', ascending: false);
  return (rows as List)
      .map((r) => Notice.fromJson(r as Map<String, dynamic>))
      .toList();
});

class NoticePage extends ConsumerWidget {
  const NoticePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncNotices = ref.watch(_noticesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('공지사항')),
      body: asyncNotices.when(
        data: (notices) {
          if (notices.isEmpty) {
            return const Center(child: Text('공지사항이 없습니다'));
          }
          return ListView.builder(
            itemCount: notices.length,
            itemBuilder: (ctx, i) {
              final n = notices[i];
              return ExpansionTile(
                title: Text(
                  n.title,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                subtitle: Text(
                  n.createdAt.toLocal().toString().substring(0, 10),
                  style: const TextStyle(fontSize: 12),
                ),
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(n.content),
                    ),
                  ),
                ],
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('오류: $e')),
      ),
    );
  }
}
