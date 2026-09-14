import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/constants.dart';
import 'shared/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: AppConstants.supabaseUrl,
    // ignore: deprecated_member_use
    anonKey: AppConstants.supabaseAnonKey,
  );

  runApp(const ProviderScope(child: PilmartApp()));
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
