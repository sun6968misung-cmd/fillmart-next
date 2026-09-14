// lib/shared/models/admin_session.dart
class AdminSession {
  final String username, role, cookie;

  const AdminSession({
    required this.username,
    required this.role,
    required this.cookie,
  });
}
