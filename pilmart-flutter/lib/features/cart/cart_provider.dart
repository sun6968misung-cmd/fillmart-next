import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/shared/models/cart_item.dart';

class CartNotifier extends Notifier<List<CartItem>> {
  @override
  List<CartItem> build() => [];

  void add(CartItem item) {
    final idx = state.indexWhere((c) => c.productId == item.productId);
    if (idx >= 0) {
      state = [
        ...state.sublist(0, idx),
        state[idx].copyWith(qty: state[idx].qty + item.qty),
        ...state.sublist(idx + 1),
      ];
    } else {
      state = [...state, item];
    }
  }

  void updateQty(String productId, int qty) {
    if (qty <= 0) {
      remove(productId);
      return;
    }
    state = state
        .map((c) => c.productId == productId ? c.copyWith(qty: qty) : c)
        .toList();
  }

  void remove(String productId) {
    state = state.where((c) => c.productId != productId).toList();
  }

  void clear() => state = [];

  int get totalAmount => state.fold(0, (sum, c) => sum + c.total);

  int get taxAmount => state
      .where((c) => c.taxType == 'tax')
      .fold(0, (sum, c) => sum + (c.total - (c.total / 1.1).round()));

  int get taxFreeAmount => state
      .where((c) => c.taxType == 'taxFree')
      .fold(0, (sum, c) => sum + c.total);
}

final cartProvider =
    NotifierProvider<CartNotifier, List<CartItem>>(CartNotifier.new);
