import 'package:flutter/material.dart';

abstract class AppColors {
  static const primary = Color(0xFF1B2A5E);   // 필마트 네이비
  static const accent  = Color(0xFFE53935);   // 필마트 레드
  static const surface = Color(0xFFF8F9FA);
  static const textPrimary   = Color(0xFF1A1A1A);
  static const textSecondary = Color(0xFF6B7280);
  static const border = Color(0xFFE5E7EB);

  // 주문 상태
  static const statusPending   = Color(0xFF9CA3AF); // 결제대기
  static const statusConfirmed = Color(0xFF3B82F6); // 주문완료
  static const statusReady     = Color(0xFFF59E0B); // 배송준비중
  static const statusShipping  = Color(0xFF10B981); // 배송중
  static const statusDone      = Color(0xFF059669); // 배송완료
  static const statusCancelled = Color(0xFFEF4444); // 취소완료
}

class AppTheme {
  static ThemeData light() => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      primary: AppColors.primary,
      secondary: AppColors.accent,
      surface: AppColors.surface,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    ),
  );
}
