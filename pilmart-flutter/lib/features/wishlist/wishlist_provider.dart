import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';

final wishlistIdsProvider = StreamProvider<List<String>>((ref) {
  final uid = supabase.auth.currentUser?.id;
  if (uid == null) return const Stream.empty();
  return supabase
      .from('wishlists')
      .stream(primaryKey: ['profile_id', 'product_id'])
      .eq('profile_id', uid)
      .map((rows) => rows.map((r) => r['product_id'] as String).toList());
});

Future<void> toggleWishlist(String productId) async {
  final uid = supabase.auth.currentUser?.id;
  if (uid == null) return;
  final existing = await supabase
      .from('wishlists')
      .select()
      .eq('profile_id', uid)
      .eq('product_id', productId);
  if ((existing as List).isNotEmpty) {
    await supabase
        .from('wishlists')
        .delete()
        .match({'profile_id': uid, 'product_id': productId});
  } else {
    await supabase
        .from('wishlists')
        .upsert({'profile_id': uid, 'product_id': productId});
  }
}
