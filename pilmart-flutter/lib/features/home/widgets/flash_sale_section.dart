import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:pilmart_flutter/core/constants.dart';
import 'package:pilmart_flutter/shared/models/flash_sale.dart';
import 'package:pilmart_flutter/shared/theme/app_theme.dart';

class FlashSaleSection extends StatefulWidget {
  const FlashSaleSection({super.key});

  @override
  State<FlashSaleSection> createState() => _FlashSaleSectionState();
}

class _FlashSaleSectionState extends State<FlashSaleSection> {
  FlashSaleConfig? _config;
  Timer? _timer;
  Duration _remaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await http.get(
        Uri.parse('${AppConstants.nextJsBaseUrl}/api/flash-sale'),
      );
      if (res.statusCode != 200) return;
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final config = FlashSaleConfig.fromJson(data);
      if (!mounted) return;
      setState(() => _config = config);
      _startTimer(config);
    } catch (_) {}
  }

  void _startTimer(FlashSaleConfig config) {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      final now = DateTime.now();
      final end = DateTime(now.year, now.month, now.day, config.endHour);
      final diff = end.difference(now);
      if (mounted) {
        setState(() => _remaining = diff.isNegative ? Duration.zero : diff);
      }
    });
  }

  bool _isActive() {
    if (_config == null) return false;
    final h = DateTime.now().hour;
    return h >= _config!.startHour && h < _config!.endHour;
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_config == null || !_isActive() || _config!.products.isEmpty) {
      return const SizedBox.shrink();
    }
    final h = _remaining.inHours.toString().padLeft(2, '0');
    final m = (_remaining.inMinutes % 60).toString().padLeft(2, '0');
    final s = (_remaining.inSeconds % 60).toString().padLeft(2, '0');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            children: [
              const Text(
                '⚡ 특가',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.accent,
                ),
              ),
              const Spacer(),
              Text(
                '$h:$m:$s',
                style: const TextStyle(
                  color: AppColors.accent,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 160,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: _config!.products.length,
            itemBuilder: (ctx, i) {
              final fp = _config!.products[i];
              return GestureDetector(
                onTap: () => context.push('/flash-product/$i'),
                child: Card(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  child: SizedBox(
                    width: 120,
                    child: Padding(
                      padding: const EdgeInsets.all(8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            fp.name,
                            maxLines: 2,
                            style: const TextStyle(fontSize: 13),
                          ),
                          const Spacer(),
                          Text(
                            '${fp.price}원',
                            style: const TextStyle(
                              color: AppColors.accent,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const Divider(),
      ],
    );
  }
}
