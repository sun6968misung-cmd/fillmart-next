// lib/shared/models/notice.dart
class Notice {
  final String id, title, content;
  final DateTime createdAt;

  const Notice({
    required this.id,
    required this.title,
    required this.content,
    required this.createdAt,
  });

  factory Notice.fromJson(Map<String, dynamic> j) => Notice(
        id: j['id'] as String,
        title: j['title'] as String,
        content: j['content'] as String? ?? '',
        createdAt: DateTime.parse(j['created_at'] as String),
      );
}
