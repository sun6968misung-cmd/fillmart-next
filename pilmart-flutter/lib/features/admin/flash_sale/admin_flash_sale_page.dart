import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/api_client.dart';
import 'package:pilmart_flutter/shared/models/flash_sale.dart';

final _flashSaleProvider = FutureProvider<FlashSaleConfig>((ref) async {
  final res = await ApiClient.instance.get('/api/flash-sale');
  return FlashSaleConfig.fromJson(res.data as Map<String, dynamic>);
});

class AdminFlashSalePage extends ConsumerStatefulWidget {
  const AdminFlashSalePage({super.key});

  @override
  ConsumerState<AdminFlashSalePage> createState() =>
      _AdminFlashSalePageState();
}

class _AdminFlashSalePageState extends ConsumerState<AdminFlashSalePage> {
  int _startHour = 9;
  int _endHour = 22;
  String? _configId;
  bool _initialized = false;
  bool _saving = false;

  void _init(FlashSaleConfig cfg) {
    if (_initialized) return;
    _startHour = cfg.startHour;
    _endHour = cfg.endHour;
    _configId = cfg.id;
    _initialized = true;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final res = await ApiClient.instance.post('/api/flash-sale', data: {
        if (_configId != null) 'id': _configId,
        'startHour': _startHour,
        'endHour': _endHour,
        'products': ref.read(_flashSaleProvider).valueOrNull?.products
                .map((p) => p.toJson())
                .toList() ??
            [],
      });
      _configId = (res.data as Map)['id'] as String?;
      ref.invalidate(_flashSaleProvider);
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('저장되었습니다')));
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
    final async = ref.watch(_flashSaleProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('특가 관리')),
      body: async.when(
        data: (cfg) {
          _init(cfg);
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text('운영 시간', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: '시작 시',
                        border: OutlineInputBorder(),
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<int>(
                          value: _startHour,
                          isDense: true,
                          items: List.generate(24, (i) => i)
                              .map((h) => DropdownMenuItem(
                                    value: h,
                                    child: Text('$h시'),
                                  ))
                              .toList(),
                          onChanged: (v) => setState(() => _startHour = v!),
                        ),
                      ),
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    child: Text('~'),
                  ),
                  Expanded(
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: '종료 시',
                        border: OutlineInputBorder(),
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<int>(
                          value: _endHour,
                          isDense: true,
                          items: List.generate(24, (i) => i)
                              .map((h) => DropdownMenuItem(
                                    value: h,
                                    child: Text('$h시'),
                                  ))
                              .toList(),
                          onChanged: (v) => setState(() => _endHour = v!),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const Text('특가 상품', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              if (cfg.products.isEmpty)
                const Text('등록된 특가 상품이 없습니다', style: TextStyle(color: Colors.grey))
              else
                ...cfg.products.map(
                  (p) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(p.name),
                    subtitle: Text(
                      '${p.price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}원'
                      '${p.stock != null ? ' · 재고 ${p.stock}' : ''}'
                      '${p.maxPerCustomer != null && p.maxPerCustomer! > 0 ? ' · 인당 ${p.maxPerCustomer}개 한정' : ''}',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
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
                    : const Text('운영 시간 저장'),
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
