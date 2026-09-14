import 'package:flutter/material.dart';
import 'package:pilmart_flutter/shared/theme/app_theme.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status});
  final String status;

  static Color _color(String s) => switch (s) {
        '결제대기' => AppColors.statusPending,
        '주문완료' => AppColors.statusConfirmed,
        '배송준비중' => AppColors.statusReady,
        '배송중' => AppColors.statusShipping,
        '배송완료' => AppColors.statusDone,
        '취소완료' => AppColors.statusCancelled,
        _ => Colors.grey,
      };

  static String _label(String s) => switch (s) {
        '주문완료' => '결제완료',
        '배송준비중' => '준비중',
        _ => s,
      };

  @override
  Widget build(BuildContext context) {
    final color = _color(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        border: Border.all(color: color),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        _label(status),
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
