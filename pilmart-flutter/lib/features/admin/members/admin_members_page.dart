import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/api_client.dart';
import 'package:pilmart_flutter/shared/models/profile.dart';

final _membersProvider = FutureProvider<List<Profile>>((ref) async {
  final res = await ApiClient.instance.get('/api/admin/members');
  return (res.data as List)
      .map((r) => Profile.fromJson(r as Map<String, dynamic>))
      .toList();
});

class AdminMembersPage extends ConsumerStatefulWidget {
  const AdminMembersPage({super.key});

  @override
  ConsumerState<AdminMembersPage> createState() => _AdminMembersPageState();
}

class _AdminMembersPageState extends ConsumerState<AdminMembersPage> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(_membersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('회원 관리'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(_membersProvider),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(
                hintText: '이름 또는 전화번호 검색',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
                isDense: true,
              ),
              onChanged: (v) => setState(() => _query = v.trim()),
            ),
          ),
          Expanded(
            child: async.when(
              data: (members) {
                final filtered = _query.isEmpty
                    ? members
                    : members
                        .where((m) =>
                            m.name.contains(_query) ||
                            m.phone.contains(_query))
                        .toList();

                if (filtered.isEmpty) {
                  return const Center(child: Text('회원이 없습니다'));
                }

                return ListView.builder(
                  itemCount: filtered.length,
                  itemBuilder: (_, i) {
                    final m = filtered[i];
                    return ListTile(
                      leading: CircleAvatar(
                        child: Text(
                          m.name.isNotEmpty ? m.name[0] : '?',
                        ),
                      ),
                      title: Text(m.name.isNotEmpty ? m.name : '이름 없음'),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(m.phone.isNotEmpty ? m.phone : '-', style: const TextStyle(fontSize: 12)),
                          if (m.userType == 'business')
                            Text(
                              '사업자: ${m.businessName ?? '-'}',
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                        ],
                      ),
                      trailing: Text(
                        m.provider ?? 'local',
                        style: const TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('오류: $e')),
            ),
          ),
        ],
      ),
    );
  }
}
