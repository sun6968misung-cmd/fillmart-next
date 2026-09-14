import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/api_client.dart';

final _storeInfoProvider = FutureProvider<Map<String, String>>((ref) async {
  final res = await ApiClient.instance.get('/api/store-info');
  return Map<String, String>.from(res.data as Map);
});

class AdminStoreInfoPage extends ConsumerStatefulWidget {
  const AdminStoreInfoPage({super.key});

  @override
  ConsumerState<AdminStoreInfoPage> createState() => _AdminStoreInfoPageState();
}

class _AdminStoreInfoPageState extends ConsumerState<AdminStoreInfoPage> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  bool _saving = false;
  bool _initialized = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  void _init(Map<String, String> info) {
    if (_initialized) return;
    _nameCtrl.text = info['name'] ?? '';
    _phoneCtrl.text = info['phone'] ?? '';
    _addressCtrl.text = info['address'] ?? '';
    _initialized = true;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ApiClient.instance.post('/api/store-info', data: {
        'name': _nameCtrl.text,
        'phone': _phoneCtrl.text,
        'address': _addressCtrl.text,
      });
      ref.invalidate(_storeInfoProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('저장되었습니다')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('오류: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(_storeInfoProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('매장 정보')),
      body: async.when(
        data: (info) {
          _init(info);
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              TextField(
                controller: _nameCtrl,
                decoration: const InputDecoration(
                  labelText: '매장명',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _phoneCtrl,
                decoration: const InputDecoration(
                  labelText: '전화번호',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _addressCtrl,
                decoration: const InputDecoration(
                  labelText: '주소',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('저장'),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('오류: $e')),
      ),
    );
  }
}
