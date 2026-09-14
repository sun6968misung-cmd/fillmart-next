import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pilmart_flutter/shared/models/product.dart';

String _fmt(int price) =>
    '${price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}원';

class ProductSearchDelegate extends SearchDelegate<Product?> {
  final List<Product> products;

  ProductSearchDelegate(this.products)
      : super(searchFieldLabel: '상품 검색...');

  List<Product> get _filtered {
    if (query.trim().isEmpty) return [];
    final q = query.trim().toLowerCase();
    return products
        .where((p) =>
            p.name.toLowerCase().contains(q) ||
            p.category.toLowerCase().contains(q))
        .toList();
  }

  @override
  List<Widget> buildActions(BuildContext context) => [
        if (query.isNotEmpty)
          IconButton(
            icon: const Icon(Icons.clear),
            onPressed: () {
              query = '';
              showSuggestions(context);
            },
          ),
      ];

  @override
  Widget buildLeading(BuildContext context) => IconButton(
        icon: const Icon(Icons.arrow_back),
        onPressed: () => close(context, null),
      );

  @override
  Widget buildSuggestions(BuildContext context) => _buildList(context);

  @override
  Widget buildResults(BuildContext context) => _buildList(context);

  Widget _buildList(BuildContext context) {
    if (query.trim().isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search, size: 48, color: Colors.grey),
            SizedBox(height: 12),
            Text('상품명 또는 카테고리로 검색하세요',
                style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    final results = _filtered;
    if (results.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.search_off, size: 48, color: Colors.grey),
            const SizedBox(height: 12),
            Text('"$query" 검색 결과가 없습니다',
                style: const TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    return ListView.separated(
      itemCount: results.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (context, i) {
        final p = results[i];
        return ListTile(
          leading: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: p.imageUrl != null
                ? CachedNetworkImage(
                    imageUrl: p.imageUrl!,
                    width: 48,
                    height: 48,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => _placeholder(),
                  )
                : _placeholder(),
          ),
          title: _HighlightText(text: p.name, query: query),
          subtitle: Text(
            '${p.category} · ${p.unit}',
            style: const TextStyle(fontSize: 12, color: Colors.grey),
          ),
          trailing: Text(
            _fmt(p.price),
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          ),
          onTap: () {
            close(context, p);
            context.go('/product/${p.id}');
          },
        );
      },
    );
  }

  Widget _placeholder() => Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Icon(Icons.image_outlined, color: Colors.grey, size: 20),
      );
}

class _HighlightText extends StatelessWidget {
  final String text, query;
  const _HighlightText({required this.text, required this.query});

  @override
  Widget build(BuildContext context) {
    final lowerText = text.toLowerCase();
    final lowerQuery = query.trim().toLowerCase();
    final idx = lowerText.indexOf(lowerQuery);

    if (idx < 0 || lowerQuery.isEmpty) {
      return Text(text, style: const TextStyle(fontSize: 14));
    }

    return Text.rich(
      TextSpan(
        children: [
          if (idx > 0)
            TextSpan(
                text: text.substring(0, idx),
                style: const TextStyle(fontSize: 14)),
          TextSpan(
            text: text.substring(idx, idx + lowerQuery.length),
            style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1B2A5E)),
          ),
          if (idx + lowerQuery.length < text.length)
            TextSpan(
                text: text.substring(idx + lowerQuery.length),
                style: const TextStyle(fontSize: 14)),
        ],
      ),
    );
  }
}
