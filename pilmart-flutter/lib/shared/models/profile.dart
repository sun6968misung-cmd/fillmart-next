// lib/shared/models/profile.dart
class Profile {
  final String id, phone, name, userType;
  final String? address, provider, fcmToken;

  const Profile({
    required this.id,
    required this.phone,
    required this.name,
    required this.userType,
    this.address,
    this.provider,
    this.fcmToken,
  });

  factory Profile.fromJson(Map<String, dynamic> j) => Profile(
        id: j['id'] as String,
        phone: j['phone'] as String? ?? '',
        name: j['name'] as String? ?? '',
        userType: j['user_type'] as String? ?? 'personal',
        address: j['address'] as String?,
        provider: j['provider'] as String?,
        fcmToken: j['fcm_token'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone': phone,
        'name': name,
        'user_type': userType,
        'address': address,
        'provider': provider,
        'fcm_token': fcmToken,
      };
}
