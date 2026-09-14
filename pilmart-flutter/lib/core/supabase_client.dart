// lib/core/supabase_client.dart
import 'package:supabase_flutter/supabase_flutter.dart';

// 초기화는 main.dart에서 수행; 이 파일은 편의 접근자만 제공
SupabaseClient get supabase => Supabase.instance.client;
