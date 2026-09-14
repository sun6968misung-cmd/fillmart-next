import 'package:flutter/material.dart';
import 'shared/theme/app_theme.dart';

void main() {
  runApp(const PilmartApp());
}

class PilmartApp extends StatelessWidget {
  const PilmartApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '필마트',
      theme: AppTheme.light(),
      home: const Scaffold(
        body: Center(child: Text('필마트')),
      ),
    );
  }
}
