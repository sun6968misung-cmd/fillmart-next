# 필마트 Flutter — Phase 1: 프로젝트 초기화·Core·모델·GoRouter·인증

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flutter 프로젝트를 생성하고 Core 인프라(Supabase, Dio+Cookie, SecureStorage)와 데이터 모델, GoRouter, 고객/관리자 인증 화면을 완성한다.

**Architecture:** 고객 기능은 Supabase Dart SDK 직접 통신(anon key + RLS), 관리자 기능은 Next.js `/api/admin/*` API를 Dio + HttpOnly 쿠키로 호출. Riverpod 2.x 코드젠 방식으로 상태 관리, GoRouter로 역할 기반 라우팅.

**Tech Stack:** Flutter 3.x · Dart 3.x · Riverpod 2.x + riverpod_annotation · GoRouter 14 · supabase_flutter 2.x · Dio 5.x · flutter_secure_storage · kakao_flutter_sdk_user · webview_flutter

**Spec:** `docs/superpowers/specs/2026-09-14-pilmart-flutter-design.md`

## Global Constraints

- Flutter SDK: 3.22 이상
- Dart SDK: 3.4 이상
- 패키지 버전: pubspec.yaml에 명시된 버전 이상 (`^` 허용)
- 패키지명(Dart): `pilmart_flutter` (언더스코어), 폴더명: `pilmart-flutter` (하이픈)
- 비밀 키는 `--dart-define` 빌드 인수로 주입 — 소스코드에 하드코딩 금지
- 인증 이메일 규칙: 전화번호 기반 `{phone}@pilmart.com` / `{phone}@kakao.pilmart.com` / `{phone}@naver.pilmart.com`
- `window.confirm` 패턴 없음 — 인라인 확인 상태로 대체
- 카테고리 값: `야채/채소`, `과일`, `축산/계란`, `수산/건어물`, `라면/면류`, `유제품/냉장/냉동`, `캔/통조림`

---

## 파일 맵

```
pilmart-flutter/
├── lib/
│   ├── main.dart                              # 앱 진입점, Supabase·Firebase 초기화
│   ├── app.dart                               # MaterialApp.router + GoRouter
│   ├── core/
│   │   ├── constants.dart                     # URL·키 상수 (--dart-define 읽기)
│   │   ├── supabase_client.dart               # Supabase.instance 접근자
│   │   ├── api_client.dart                    # Dio 싱글턴 + AdminCookieInterceptor
│   │   └── secure_storage.dart                # flutter_secure_storage 래퍼
│   ├── shared/
│   │   ├── models/
│   │   │   ├── product.dart                   # Product, ProductOverride
│   │   │   ├── order.dart                     # Order, OrderItem
│   │   │   ├── profile.dart                   # Profile
│   │   │   ├── wishlist_item.dart             # WishlistItem
│   │   │   ├── notice.dart                    # Notice
│   │   │   ├── flash_sale.dart                # FlashSaleConfig, FlashProduct
│   │   │   └── admin_session.dart             # AdminSession
│   │   └── theme/
│   │       └── app_theme.dart                 # 색상·텍스트 테마
│   └── features/
│       ├── auth/
│       │   ├── customer_auth_provider.dart    # Riverpod: Supabase 세션 관리
│       │   ├── admin_auth_provider.dart       # Riverpod: 관리자 세션 관리
│       │   ├── auth_page.dart                 # 전화번호 로그인/회원가입 + 소셜 버튼
│       │   ├── kakao_auth.dart                # 카카오 SDK 로직
│       │   ├── naver_auth_webview.dart        # 네이버 OAuth WebView 화면
│       │   └── admin_login_page.dart          # 관리자 로그인 화면
│       ├── home/
│       │   └── customer_shell.dart            # BottomNavigationBar 쉘 (placeholder)
│       └── admin/
│           └── admin_shell.dart               # NavigationDrawer 쉘 (placeholder)
├── test/
│   ├── core/
│   │   ├── api_client_test.dart
│   │   └── secure_storage_test.dart
│   ├── models/
│   │   ├── product_test.dart
│   │   ├── order_test.dart
│   │   └── profile_test.dart
│   └── auth/
│       ├── customer_auth_provider_test.dart
│       └── admin_auth_provider_test.dart
└── pubspec.yaml
```

---

### Task 1: 프로젝트 생성 + pubspec.yaml + 테마

**Files:**
- Create: `pilmart-flutter/` (flutter create)
- Create: `pilmart-flutter/pubspec.yaml`
- Create: `lib/shared/theme/app_theme.dart`

**Interfaces:**
- Produces: `AppTheme.light()` → `ThemeData`; `AppColors.primary`, `AppColors.accent`

- [ ] **Step 1: Flutter 프로젝트 생성**

```powershell
cd C:\Users\USER\.antigravity-ide
flutter create pilmart_flutter --org com.pilmart --platforms android,ios
Rename-Item pilmart_flutter pilmart-flutter
cd pilmart-flutter
```

- [ ] **Step 2: pubspec.yaml 교체**

`pilmart-flutter/pubspec.yaml` 전체를 아래로 교체:

```yaml
name: pilmart_flutter
description: 필마트 쇼핑몰 앱
publish_to: none
version: 1.0.0+1

environment:
  sdk: ">=3.4.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.6.1
  riverpod_annotation: ^2.6.1
  go_router: ^14.2.0
  supabase_flutter: ^2.8.0
  dio: ^5.7.0
  flutter_secure_storage: ^9.2.2
  webview_flutter: ^4.10.0
  kakao_flutter_sdk_user: ^1.9.6
  firebase_core: ^3.6.0
  firebase_messaging: ^15.1.0
  cached_network_image: ^3.4.1
  url_launcher: ^6.3.1
  intl: ^0.19.0
  http: ^1.2.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0
  riverpod_generator: ^2.6.1
  build_runner: ^2.4.13
  mockito: ^5.4.4
  build: ^2.4.1

flutter:
  uses-material-design: true
```

```powershell
flutter pub get
```

- [ ] **Step 3: 테마 작성**

`lib/shared/theme/app_theme.dart`:

```dart
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
```

- [ ] **Step 4: 테마 스모크 테스트 — `flutter analyze` 통과 확인**

```powershell
flutter analyze lib/shared/theme/app_theme.dart
```
Expected: No issues found.

- [ ] **Step 5: 커밋**

```powershell
git add pilmart-flutter/
git commit -m "feat: Flutter 프로젝트 초기화 + pubspec + AppTheme"
```

---

### Task 2: Core 레이어 (constants · Supabase · Dio + Cookie · SecureStorage)

**Files:**
- Create: `lib/core/constants.dart`
- Create: `lib/core/secure_storage.dart`
- Create: `lib/core/supabase_client.dart`
- Create: `lib/core/api_client.dart`
- Test: `test/core/api_client_test.dart`

**Interfaces:**
- Produces:
  - `AppConstants.supabaseUrl`, `.supabaseAnonKey`, `.nextJsBaseUrl`, `.kakaoAppKey`
  - `SecureStorageService.saveAdminCookie(String)`, `.getAdminCookie()`, `.deleteAdminCookie()`
  - `supabase` → `SupabaseClient` (글로벌 접근자)
  - `ApiClient.instance` → `Dio` (Cookie 인터셉터 포함)

- [ ] **Step 1: constants.dart**

```dart
// lib/core/constants.dart
abstract class AppConstants {
  // --dart-define=SUPABASE_URL=https://... 로 주입
  static const supabaseUrl =
      String.fromEnvironment('SUPABASE_URL', defaultValue: '');
  static const supabaseAnonKey =
      String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: '');
  static const nextJsBaseUrl =
      String.fromEnvironment('NEXTJS_BASE_URL', defaultValue: 'http://10.0.2.2:3000');
  static const kakaoAppKey =
      String.fromEnvironment('KAKAO_APP_KEY', defaultValue: '');
  static const naverClientId =
      String.fromEnvironment('NAVER_CLIENT_ID', defaultValue: '');
  static const naverCallbackUrl = 'pilmart://naver-callback';
}
```

> Android 에뮬레이터에서 localhost = `10.0.2.2`. 실기기/배포 시 실제 도메인으로 교체.

- [ ] **Step 2: secure_storage.dart**

```dart
// lib/core/secure_storage.dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _instance = SecureStorageService._();
  factory SecureStorageService() => _instance;
  const SecureStorageService._();

  final _storage = const FlutterSecureStorage();
  static const _adminCookieKey = 'admin_session_cookie';

  Future<void> saveAdminCookie(String cookie) =>
      _storage.write(key: _adminCookieKey, value: cookie);

  Future<String?> getAdminCookie() =>
      _storage.read(key: _adminCookieKey);

  Future<void> deleteAdminCookie() =>
      _storage.delete(key: _adminCookieKey);
}
```

- [ ] **Step 3: supabase_client.dart**

```dart
// lib/core/supabase_client.dart
import 'package:supabase_flutter/supabase_flutter.dart';

// 초기화는 main.dart에서 수행; 이 파일은 편의 접근자만 제공
SupabaseClient get supabase => Supabase.instance.client;
```

- [ ] **Step 4: api_client.dart (Dio + AdminCookieInterceptor)**

```dart
// lib/core/api_client.dart
import 'package:dio/dio.dart';
import 'secure_storage.dart';
import 'constants.dart';

class AdminCookieInterceptor extends Interceptor {
  final _storage = SecureStorageService();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final cookie = await _storage.getAdminCookie();
    if (cookie != null) options.headers['Cookie'] = cookie;
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) async {
    final setCookieList = response.headers['set-cookie'];
    if (setCookieList != null && setCookieList.isNotEmpty) {
      // "admin_session=TOKEN; Path=/; HttpOnly; ..." 에서 첫 세그먼트만 저장
      final raw = setCookieList.first;
      final cookiePart = raw.split(';').first.trim();
      if (cookiePart.startsWith('admin_session=')) {
        await _storage.saveAdminCookie(cookiePart);
      }
    }
    handler.next(response);
  }
}

class ApiClient {
  static Dio? _dio;

  static Dio get instance {
    _dio ??= Dio(BaseOptions(baseUrl: AppConstants.nextJsBaseUrl))
      ..interceptors.add(AdminCookieInterceptor());
    return _dio!;
  }
}
```

- [ ] **Step 5: main.dart 업데이트**

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/constants.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: AppConstants.supabaseUrl,
    anonKey: AppConstants.supabaseAnonKey,
  );

  runApp(const ProviderScope(child: PilmartApp()));
}
```

- [ ] **Step 6: 인터셉터 단위 테스트 작성**

`test/core/api_client_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:pilmart_flutter/core/api_client.dart';

void main() {
  group('AdminCookieInterceptor', () {
    test('set-cookie 헤더에서 admin_session 값을 추출한다', () {
      // 쿠키 파싱 로직을 직접 검증
      const raw = 'admin_session=abc123; Path=/; HttpOnly; SameSite=Strict';
      final cookiePart = raw.split(';').first.trim();
      expect(cookiePart, 'admin_session=abc123');
      expect(cookiePart.startsWith('admin_session='), isTrue);
    });

    test('admin_session이 없는 set-cookie는 무시한다', () {
      const raw = 'other_cookie=xyz; Path=/';
      final cookiePart = raw.split(';').first.trim();
      expect(cookiePart.startsWith('admin_session='), isFalse);
    });
  });
}
```

- [ ] **Step 7: 테스트 실행**

```powershell
cd pilmart-flutter
flutter test test/core/api_client_test.dart
```
Expected: 2 tests passed.

- [ ] **Step 8: 커밋**

```powershell
git add pilmart-flutter/
git commit -m "feat: Core 레이어 — constants, SecureStorage, Supabase 초기화, Dio+Cookie"
```

---

### Task 3: 데이터 모델 (fromJson / toJson)

**Files:**
- Create: `lib/shared/models/product.dart`
- Create: `lib/shared/models/order.dart`
- Create: `lib/shared/models/profile.dart`
- Create: `lib/shared/models/wishlist_item.dart`
- Create: `lib/shared/models/notice.dart`
- Create: `lib/shared/models/flash_sale.dart`
- Create: `lib/shared/models/admin_session.dart`
- Test: `test/models/product_test.dart`, `order_test.dart`, `profile_test.dart`

**Interfaces:**
- Produces:
  - `Product.fromJson(Map<String,dynamic>)`, `.toJson()`; fields: `id, name, category, unit, taxType, price, imageUrl, description, isHidden, isFlash`
  - `OrderItem.fromJson(...)`, `.toJson()`; fields: `id, name, price, qty, taxType`
  - `Order.fromJson(...)`, `.toJson()`; fields: `id, orderKey, status, userId, customerName, deliveryAddress, paymentMethod, totalAmount, vatAmount, items, createdAt, cancelledItems`
  - `Profile.fromJson(...)`, `.toJson()`; fields: `id, phone, name, address, provider, fcmToken, userType`
  - `WishlistItem.fromJson(...)`, `.product` → `Product`
  - `Notice.fromJson(...)`; fields: `id, title, content, createdAt`
  - `FlashSaleConfig.fromJson(...)`; fields: `id, startHour, endHour, isActive, products`
  - `FlashProduct.fromJson(...)`; fields: `name, price, stock, maxPerCustomer, imageUrl`
  - `AdminSession`; fields: `username, role, cookie` (SecureStorage용, fromJson 불필요)

- [ ] **Step 1: 실패 테스트 작성**

`test/models/product_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:pilmart_flutter/shared/models/product.dart';

void main() {
  group('Product', () {
    const json = {
      'id': 'veg1',
      'name': '양배추 1통',
      'category': '야채/채소',
      'unit': '1통',
      'tax_type': 'taxFree',
      'price': 3500,
      'image_url': null,
      'description': '아삭한 국산 양배추.',
      'is_hidden': false,
      'is_flash': false,
    };

    test('fromJson 파싱', () {
      final p = Product.fromJson(json);
      expect(p.id, 'veg1');
      expect(p.price, 3500);
      expect(p.taxType, 'taxFree');
      expect(p.isHidden, false);
    });

    test('toJson 직렬화', () {
      final p = Product.fromJson(json);
      final out = p.toJson();
      expect(out['id'], 'veg1');
      expect(out['tax_type'], 'taxFree');
    });
  });
}
```

`test/models/order_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:pilmart_flutter/shared/models/order.dart';

void main() {
  group('Order', () {
    final json = {
      'id': 'uuid-1',
      'order_key': 'pilmart_abc123',
      'status': '주문완료',
      'user_id': 'user-uuid',
      'customer_name': '홍길동',
      'delivery_address': '경북 구미시',
      'payment_method': '카드',
      'total_amount': 15000,
      'vat_amount': 1364,
      'items': [
        {'id': 'veg1', 'name': '양배추', 'price': 3500, 'qty': 2, 'tax_type': 'taxFree'}
      ],
      'created_at': '2026-09-14T10:00:00Z',
      'cancelled_items': null,
    };

    test('fromJson 파싱', () {
      final o = Order.fromJson(json);
      expect(o.orderKey, 'pilmart_abc123');
      expect(o.items.length, 1);
      expect(o.items.first.qty, 2);
    });
  });
}
```

`test/models/profile_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:pilmart_flutter/shared/models/profile.dart';

void main() {
  test('Profile.fromJson — business 사용자', () {
    final json = {
      'id': 'uuid-1',
      'phone': '01012345678',
      'name': '홍길동',
      'address': '경북 구미시',
      'provider': 'local',
      'fcm_token': null,
      'user_type': 'business',
    };
    final p = Profile.fromJson(json);
    expect(p.userType, 'business');
    expect(p.phone, '01012345678');
  });
}
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

```powershell
flutter test test/models/
```
Expected: FAIL (파일 없음)

- [ ] **Step 3: product.dart 구현**

```dart
// lib/shared/models/product.dart
class Product {
  final String id, name, category, unit, taxType;
  final int price;
  final String? imageUrl, description;
  final bool isHidden, isFlash;

  const Product({
    required this.id,
    required this.name,
    required this.category,
    required this.unit,
    required this.taxType,
    required this.price,
    this.imageUrl,
    this.description,
    this.isHidden = false,
    this.isFlash = false,
  });

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: j['id'] as String,
        name: j['name'] as String,
        category: j['category'] as String? ?? '',
        unit: j['unit'] as String? ?? '',
        taxType: j['tax_type'] as String? ?? 'taxFree',
        price: j['price'] as int,
        imageUrl: j['image_url'] as String?,
        description: j['description'] as String?,
        isHidden: j['is_hidden'] as bool? ?? false,
        isFlash: j['is_flash'] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'category': category,
        'unit': unit,
        'tax_type': taxType,
        'price': price,
        'image_url': imageUrl,
        'description': description,
        'is_hidden': isHidden,
        'is_flash': isFlash,
      };
}
```

- [ ] **Step 4: order.dart 구현**

```dart
// lib/shared/models/order.dart
class OrderItem {
  final String id, name, taxType;
  final int price, qty;

  const OrderItem({
    required this.id,
    required this.name,
    required this.price,
    required this.qty,
    required this.taxType,
  });

  factory OrderItem.fromJson(Map<String, dynamic> j) => OrderItem(
        id: j['id'] as String,
        name: j['name'] as String,
        price: j['price'] as int,
        qty: j['qty'] as int,
        taxType: j['tax_type'] as String? ?? 'taxFree',
      );

  Map<String, dynamic> toJson() =>
      {'id': id, 'name': name, 'price': price, 'qty': qty, 'tax_type': taxType};
}

class Order {
  final String id, orderKey, status;
  final String? userId, customerName, deliveryAddress, paymentMethod;
  final int totalAmount, vatAmount;
  final List<OrderItem> items;
  final DateTime createdAt;
  final List<OrderItem>? cancelledItems;

  const Order({
    required this.id,
    required this.orderKey,
    required this.status,
    this.userId,
    this.customerName,
    this.deliveryAddress,
    this.paymentMethod,
    required this.totalAmount,
    required this.vatAmount,
    required this.items,
    required this.createdAt,
    this.cancelledItems,
  });

  factory Order.fromJson(Map<String, dynamic> j) => Order(
        id: j['id'] as String,
        orderKey: j['order_key'] as String,
        status: j['status'] as String,
        userId: j['user_id'] as String?,
        customerName: j['customer_name'] as String?,
        deliveryAddress: j['delivery_address'] as String?,
        paymentMethod: j['payment_method'] as String?,
        totalAmount: j['total_amount'] as int? ?? 0,
        vatAmount: j['vat_amount'] as int? ?? 0,
        items: (j['items'] as List<dynamic>)
            .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        createdAt: DateTime.parse(j['created_at'] as String),
        cancelledItems: (j['cancelled_items'] as List<dynamic>?)
            ?.map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'order_key': orderKey,
        'status': status,
        'user_id': userId,
        'customer_name': customerName,
        'delivery_address': deliveryAddress,
        'payment_method': paymentMethod,
        'total_amount': totalAmount,
        'vat_amount': vatAmount,
        'items': items.map((e) => e.toJson()).toList(),
        'created_at': createdAt.toIso8601String(),
        'cancelled_items': cancelledItems?.map((e) => e.toJson()).toList(),
      };
}
```

- [ ] **Step 5: profile.dart 구현**

```dart
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
```

- [ ] **Step 6: 나머지 모델 구현**

`lib/shared/models/wishlist_item.dart`:

```dart
import 'product.dart';

class WishlistItem {
  final String productId;
  final Product product;

  const WishlistItem({required this.productId, required this.product});

  factory WishlistItem.fromJson(Map<String, dynamic> j) => WishlistItem(
        productId: j['product_id'] as String,
        product: Product.fromJson(j['products'] as Map<String, dynamic>),
      );
}
```

`lib/shared/models/notice.dart`:

```dart
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
```

`lib/shared/models/flash_sale.dart`:

```dart
class FlashProduct {
  final String name;
  final int price;
  final int? stock, maxPerCustomer;
  final String? imageUrl;

  const FlashProduct({
    required this.name,
    required this.price,
    this.stock,
    this.maxPerCustomer,
    this.imageUrl,
  });

  factory FlashProduct.fromJson(Map<String, dynamic> j) => FlashProduct(
        name: j['name'] as String,
        price: j['price'] as int,
        stock: j['stock'] as int?,
        maxPerCustomer: j['maxPerCustomer'] as int?,
        imageUrl: j['imageUrl'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'price': price,
        'stock': stock,
        'maxPerCustomer': maxPerCustomer,
        'imageUrl': imageUrl,
      };
}

class FlashSaleConfig {
  final String? id;
  final int startHour, endHour;
  final bool isActive;
  final List<FlashProduct> products;

  const FlashSaleConfig({
    this.id,
    required this.startHour,
    required this.endHour,
    required this.isActive,
    required this.products,
  });

  factory FlashSaleConfig.fromJson(Map<String, dynamic> j) => FlashSaleConfig(
        id: j['id'] as String?,
        startHour: j['start_hour'] as int? ?? 0,
        endHour: j['end_hour'] as int? ?? 0,
        isActive: j['is_active'] as bool? ?? false,
        products: (j['products'] as List<dynamic>? ?? [])
            .map((e) => FlashProduct.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
```

`lib/shared/models/admin_session.dart`:

```dart
class AdminSession {
  final String username, role, cookie;

  const AdminSession({
    required this.username,
    required this.role,
    required this.cookie,
  });
}
```

- [ ] **Step 7: 테스트 실행 → PASS 확인**

```powershell
flutter test test/models/
```
Expected: 4 tests passed.

- [ ] **Step 8: 커밋**

```powershell
git add pilmart-flutter/
git commit -m "feat: 데이터 모델 7종 (Product, Order, Profile, WishlistItem, Notice, FlashSale, AdminSession)"
```

---

### Task 4: GoRouter + 쉘 scaffold

**Files:**
- Create: `lib/app.dart`
- Create: `lib/features/auth/router_notifier.dart`
- Create: `lib/features/home/customer_shell.dart`
- Create: `lib/features/admin/admin_shell.dart`

**Interfaces:**
- Consumes: `customerAuthProvider` (Task 5에서 구현), `adminSessionProvider` (Task 7에서 구현)
- Produces: `PilmartApp` Widget; 라우트 `/auth`, `/admin/login`, `/home`, `/admin/orders`

> **주의:** Task 5·7 이전이므로 Provider를 `null`을 반환하는 stub으로 먼저 정의하고, Task 5·7에서 실제 구현으로 교체한다.

- [ ] **Step 1: stub Provider 작성 (임시)**

`lib/features/auth/customer_auth_provider.dart` (stub):

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final customerAuthProvider = StreamProvider<User?>((ref) {
  return Supabase.instance.client.auth.onAuthStateChange
      .map((event) => event.session?.user);
});
```

`lib/features/auth/admin_auth_provider.dart` (stub):

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/models/admin_session.dart';

final adminSessionProvider = StateProvider<AdminSession?>((ref) => null);
```

- [ ] **Step 2: CustomerShell 작성**

`lib/features/home/customer_shell.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class CustomerShell extends StatelessWidget {
  final Widget child;
  const CustomerShell({super.key, required this.child});

  static const _tabs = [
    (icon: Icons.home_outlined,      label: '홈',     path: '/home'),
    (icon: Icons.grid_view_outlined, label: '카테고리', path: '/category'),
    (icon: Icons.favorite_border,    label: '찜',     path: '/wishlist'),
    (icon: Icons.receipt_long_outlined, label: '주문', path: '/orders'),
    (icon: Icons.person_outline,     label: '마이',   path: '/profile'),
  ];

  int _currentIndex(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    for (var i = 0; i < _tabs.length; i++) {
      if (loc.startsWith(_tabs[i].path)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex(context),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Theme.of(context).colorScheme.primary,
        onTap: (i) => context.go(_tabs[i].path),
        items: _tabs
            .map((t) => BottomNavigationBarItem(
                  icon: Icon(t.icon),
                  label: t.label,
                ))
            .toList(),
      ),
    );
  }
}
```

- [ ] **Step 3: AdminShell 작성**

`lib/features/admin/admin_shell.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth/admin_auth_provider.dart';

class AdminShell extends ConsumerWidget {
  final Widget child;
  const AdminShell({super.key, required this.child});

  static const _allTabs = [
    (label: '주문 관리',   path: '/admin/orders',    roles: ['super','product','order']),
    (label: '상품 관리',   path: '/admin/products',  roles: ['super','product']),
    (label: '특가 관리',   path: '/admin/flash-sale', roles: ['super','product']),
    (label: '공지 관리',   path: '/admin/notices',   roles: ['super']),
    (label: '매장 정보',   path: '/admin/store-info', roles: ['super']),
    (label: '회원 관리',   path: '/admin/members',   roles: ['super']),
    (label: '계정 관리',   path: '/admin/accounts',  roles: ['super']),
    (label: '감사 로그',   path: '/admin/logs',      roles: ['super']),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(adminSessionProvider);
    final role = session?.role ?? 'order';
    final tabs = _allTabs.where((t) => t.roles.contains(role)).toList();

    return Scaffold(
      body: Row(
        children: [
          NavigationDrawer(
            selectedIndex: tabs.indexWhere((t) =>
                GoRouterState.of(context).matchedLocation.startsWith(t.path)),
            onDestinationSelected: (i) => context.go(tabs[i].path),
            children: [
              DrawerHeader(
                decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('필마트 관리자',
                        style: TextStyle(color: Colors.white, fontSize: 18)),
                    Text(session?.username ?? '',
                        style: const TextStyle(color: Colors.white70)),
                    Text(role,
                        style: const TextStyle(color: Colors.white54, fontSize: 12)),
                    const Spacer(),
                    TextButton(
                      onPressed: () {
                        ref.read(adminSessionProvider.notifier).state = null;
                        context.go('/admin/login');
                      },
                      child: const Text('로그아웃',
                          style: TextStyle(color: Colors.white70)),
                    ),
                  ],
                ),
              ),
              ...tabs.map((t) => NavigationDrawerDestination(
                    icon: const Icon(Icons.circle_outlined),
                    label: Text(t.label),
                  )),
            ],
          ),
          const VerticalDivider(width: 1),
          Expanded(child: child),
        ],
      ),
    );
  }
}
```

- [ ] **Step 4: app.dart (GoRouter + redirect)**

`lib/app.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'features/auth/customer_auth_provider.dart';
import 'features/auth/admin_auth_provider.dart';
import 'features/home/customer_shell.dart';
import 'features/admin/admin_shell.dart';
import 'shared/theme/app_theme.dart';

// 플레이스홀더 화면 (Task 5~8에서 실제 구현으로 교체)
class _PlaceholderPage extends StatelessWidget {
  final String title;
  const _PlaceholderPage(this.title);
  @override
  Widget build(BuildContext context) =>
      Scaffold(appBar: AppBar(title: Text(title)),
               body: Center(child: Text(title)));
}

class PilmartApp extends ConsumerWidget {
  const PilmartApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = GoRouter(
      initialLocation: '/home',
      redirect: (context, state) {
        final loc = state.matchedLocation;
        final isAdminArea = loc.startsWith('/admin') && loc != '/admin/login';
        final isPublicArea = loc == '/auth' || loc == '/admin/login';

        final adminSession = ref.read(adminSessionProvider);
        final customerUser = ref.read(customerAuthProvider).valueOrNull;

        if (isAdminArea && adminSession == null) return '/admin/login';
        if (!isPublicArea && !loc.startsWith('/admin') && customerUser == null) {
          return '/auth';
        }
        return null;
      },
      routes: [
        GoRoute(path: '/auth',
            builder: (_, __) => const _PlaceholderPage('로그인')),
        GoRoute(path: '/admin/login',
            builder: (_, __) => const _PlaceholderPage('관리자 로그인')),

        // 고객 쉘
        ShellRoute(
          builder: (_, __, child) => CustomerShell(child: child),
          routes: [
            GoRoute(path: '/home',
                builder: (_, __) => const _PlaceholderPage('홈')),
            GoRoute(path: '/category',
                builder: (_, __) => const _PlaceholderPage('카테고리')),
            GoRoute(path: '/category/:slug',
                builder: (_, s) => _PlaceholderPage('카테고리: ${s.pathParameters['slug']}')),
            GoRoute(path: '/product/:id',
                builder: (_, s) => _PlaceholderPage('상품: ${s.pathParameters['id']}')),
            GoRoute(path: '/flash-product/:idx',
                builder: (_, s) => _PlaceholderPage('특가: ${s.pathParameters['idx']}')),
            GoRoute(path: '/cart',
                builder: (_, __) => const _PlaceholderPage('장바구니')),
            GoRoute(path: '/checkout',
                builder: (_, __) => const _PlaceholderPage('결제')),
            GoRoute(path: '/checkout/payment',
                builder: (_, __) => const _PlaceholderPage('Toss 결제')),
            GoRoute(path: '/success',
                builder: (_, __) => const _PlaceholderPage('결제완료')),
            GoRoute(path: '/orders',
                builder: (_, __) => const _PlaceholderPage('주문내역')),
            GoRoute(path: '/orders/lookup',
                builder: (_, __) => const _PlaceholderPage('비회원 주문조회')),
            GoRoute(path: '/wishlist',
                builder: (_, __) => const _PlaceholderPage('찜 목록')),
            GoRoute(path: '/profile',
                builder: (_, __) => const _PlaceholderPage('마이페이지')),
            GoRoute(path: '/notice',
                builder: (_, __) => const _PlaceholderPage('공지사항')),
          ],
        ),

        // 관리자 쉘
        ShellRoute(
          builder: (_, __, child) => AdminShell(child: child),
          routes: [
            GoRoute(path: '/admin/orders',
                builder: (_, __) => const _PlaceholderPage('주문 관리')),
            GoRoute(path: '/admin/products',
                builder: (_, __) => const _PlaceholderPage('상품 관리')),
            GoRoute(path: '/admin/flash-sale',
                builder: (_, __) => const _PlaceholderPage('특가 관리')),
            GoRoute(path: '/admin/notices',
                builder: (_, __) => const _PlaceholderPage('공지 관리')),
            GoRoute(path: '/admin/store-info',
                builder: (_, __) => const _PlaceholderPage('매장 정보')),
            GoRoute(path: '/admin/members',
                builder: (_, __) => const _PlaceholderPage('회원 관리')),
            GoRoute(path: '/admin/member/:phone',
                builder: (_, s) => _PlaceholderPage('회원: ${s.pathParameters['phone']}')),
            GoRoute(path: '/admin/member/:phone/day/:date',
                builder: (_, s) => _PlaceholderPage('일별 주문: ${s.pathParameters['date']}')),
            GoRoute(path: '/admin/accounts',
                builder: (_, __) => const _PlaceholderPage('계정 관리')),
            GoRoute(path: '/admin/logs',
                builder: (_, __) => const _PlaceholderPage('감사 로그')),
          ],
        ),
      ],
    );

    return MaterialApp.router(
      title: '필마트',
      theme: AppTheme.light(),
      routerConfig: router,
    );
  }
}
```

- [ ] **Step 5: `flutter run` 으로 앱 기동 확인 (에뮬레이터)**

```powershell
flutter run --dart-define=SUPABASE_URL=https://vryflbbxxnbulsukvjub.supabase.co \
            --dart-define=SUPABASE_ANON_KEY=<anon_key> \
            --dart-define=NEXTJS_BASE_URL=http://10.0.2.2:3000
```

Expected: 앱 기동 → `/auth`로 리다이렉트 (customerUser == null)

- [ ] **Step 6: 커밋**

```powershell
git add pilmart-flutter/
git commit -m "feat: GoRouter + CustomerShell + AdminShell scaffold (placeholder 화면)"
```

---

### Task 5: 고객 인증 — 전화번호 로그인 / 회원가입

**Files:**
- Modify: `lib/features/auth/customer_auth_provider.dart` (stub → 실제 구현)
- Create: `lib/features/auth/auth_page.dart`
- Test: `test/auth/customer_auth_provider_test.dart`

**Interfaces:**
- Consumes: `supabase` (core/supabase_client.dart)
- Produces:
  - `customerAuthProvider` → `AsyncValue<User?>`
  - `AuthNotifier.signInWithPhone(phone, password)`
  - `AuthNotifier.signUpWithPhone(phone, password, name)`
  - `AuthNotifier.signOut()`

- [ ] **Step 1: 단위 테스트 작성**

`test/auth/customer_auth_provider_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  // 실제 Supabase 연결이 필요한 통합 테스트는 flutter drive로 별도 실행
  // 여기서는 이메일 변환 규칙만 검증한다
  group('auth 이메일 변환 규칙', () {
    String toEmail(String phone) => '$phone@pilmart.com';
    String toKakaoEmail(String phone) => '$phone@kakao.pilmart.com';
    String toNaverEmail(String phone) => '$phone@naver.pilmart.com';

    test('전화번호 → 이메일', () {
      expect(toEmail('01012345678'), '01012345678@pilmart.com');
    });
    test('카카오 이메일', () {
      expect(toKakaoEmail('01012345678'), '01012345678@kakao.pilmart.com');
    });
    test('네이버 이메일', () {
      expect(toNaverEmail('01012345678'), '01012345678@naver.pilmart.com');
    });
  });
}
```

- [ ] **Step 2: 테스트 실행 → PASS**

```powershell
flutter test test/auth/customer_auth_provider_test.dart
```

- [ ] **Step 3: customer_auth_provider.dart 실제 구현으로 교체**

```dart
// lib/features/auth/customer_auth_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/supabase_client.dart';

final customerAuthProvider = StreamProvider<User?>((ref) {
  return supabase.auth.onAuthStateChange.map((e) => e.session?.user);
});

class AuthNotifier extends StateNotifier<AsyncValue<void>> {
  AuthNotifier() : super(const AsyncValue.data(null));

  String _toEmail(String phone) => '$phone@pilmart.com';

  Future<void> signInWithPhone(String phone, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await supabase.auth.signInWithPassword(
        email: _toEmail(phone),
        password: password,
      );
    });
  }

  Future<void> signUpWithPhone(String phone, String password, String name) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await supabase.auth.signUp(
        email: _toEmail(phone),
        password: password,
        data: {'phone': phone, 'name': name, 'provider': 'local'},
      );
    });
  }

  Future<void> signOut() async {
    await supabase.auth.signOut();
  }
}

final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<void>>(
        (_) => AuthNotifier());
```

- [ ] **Step 4: auth_page.dart 구현**

```dart
// lib/features/auth/auth_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'customer_auth_provider.dart';
import 'kakao_auth.dart';
import 'naver_auth_webview.dart';

class AuthPage extends ConsumerStatefulWidget {
  const AuthPage({super.key});
  @override
  ConsumerState<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends ConsumerState<AuthPage> {
  final _phoneCtrl = TextEditingController();
  final _pwCtrl    = TextEditingController();
  final _nameCtrl  = TextEditingController();
  bool _isRegister = false;

  Future<void> _submit() async {
    final phone = _phoneCtrl.text.trim();
    final pw    = _pwCtrl.text.trim();
    if (_isRegister) {
      await ref.read(authNotifierProvider.notifier)
          .signUpWithPhone(phone, pw, _nameCtrl.text.trim());
    } else {
      await ref.read(authNotifierProvider.notifier)
          .signInWithPhone(phone, pw);
    }
    final auth = ref.read(authNotifierProvider);
    if (auth.hasError) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(auth.error.toString())));
      }
    } else {
      if (mounted) context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = ref.watch(authNotifierProvider).isLoading;
    return Scaffold(
      appBar: AppBar(title: const Text('필마트')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(children: [
          const SizedBox(height: 32),
          TextField(controller: _phoneCtrl,
              decoration: const InputDecoration(labelText: '전화번호'),
              keyboardType: TextInputType.phone),
          const SizedBox(height: 12),
          if (_isRegister) ...[
            TextField(controller: _nameCtrl,
                decoration: const InputDecoration(labelText: '이름')),
            const SizedBox(height: 12),
          ],
          TextField(controller: _pwCtrl,
              decoration: const InputDecoration(labelText: '비밀번호'),
              obscureText: true),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: loading ? null : _submit,
            child: Text(_isRegister ? '회원가입' : '로그인'),
          ),
          TextButton(
            onPressed: () => setState(() => _isRegister = !_isRegister),
            child: Text(_isRegister ? '이미 계정이 있어요' : '회원가입'),
          ),
          const Divider(height: 32),
          OutlinedButton.icon(
            icon: const Icon(Icons.chat_bubble),
            label: const Text('카카오로 시작하기'),
            onPressed: () => KakaoAuth.signIn(context, ref),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            icon: const Icon(Icons.search),
            label: const Text('네이버로 시작하기'),
            onPressed: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const NaverAuthWebView())),
          ),
          const Spacer(),
          TextButton(
            onPressed: () => context.push('/admin/login'),
            child: const Text('관리자 로그인', style: TextStyle(fontSize: 12)),
          ),
        ]),
      ),
    );
  }
}
```

- [ ] **Step 5: app.dart의 `/auth` 플레이스홀더를 AuthPage로 교체**

`lib/app.dart`에서:

```dart
// 기존
GoRoute(path: '/auth', builder: (_, __) => const _PlaceholderPage('로그인')),
// 교체
GoRoute(path: '/auth', builder: (_, __) => const AuthPage()),
```
그리고 `import 'features/auth/auth_page.dart';` 추가.

- [ ] **Step 6: 에뮬레이터에서 로그인 화면 확인**

```powershell
flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...
```
Expected: 로그인 화면 렌더링, 전화번호/비밀번호 입력 가능.

- [ ] **Step 7: 커밋**

```powershell
git add pilmart-flutter/
git commit -m "feat: 고객 인증 — 전화번호 로그인/회원가입 (Supabase Auth)"
```

---

### Task 6: 소셜 로그인 — 카카오 + 네이버

**Files:**
- Create: `lib/features/auth/kakao_auth.dart`
- Create: `lib/features/auth/naver_auth_webview.dart`
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `ios/Runner/Info.plist`

**Interfaces:**
- Consumes: `authNotifierProvider`, `supabase`
- Produces: `KakaoAuth.signIn(context, ref)` → 카카오 로그인 후 `/home` 이동; `NaverAuthWebView` → 네이버 토큰 취득 후 로그인

- [ ] **Step 1: kakao_flutter_sdk 네이티브 설정**

`android/app/src/main/AndroidManifest.xml`의 `<application>` 태그 안에 추가:

```xml
<activity
    android:name="com.kakao.sdk.flutter.AuthCodeCustomTabsActivity"
    android:exported="true">
    <intent-filter android:label="flutter_web_auth">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="kakao${KAKAO_APP_KEY}" android:host="oauth" />
    </intent-filter>
</activity>
```

`ios/Runner/Info.plist`에 추가:

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>kakaokompassauth</string>
    <string>storykompassauth</string>
    <string>kakaolink</string>
    <string>kakaotalk</string>
</array>
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array><string>kakao$(KAKAO_APP_KEY)</string></array>
    </dict>
</array>
```

- [ ] **Step 2: kakao_auth.dart 구현**

```dart
// lib/features/auth/kakao_auth.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kakao_flutter_sdk_user/kakao_flutter_sdk_user.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/constants.dart';
import '../../core/supabase_client.dart';

abstract class KakaoAuth {
  static Future<void> signIn(BuildContext context, WidgetRef ref) async {
    try {
      // 1. 카카오 로그인
      if (await isKakaoTalkInstalled()) {
        await UserApi.instance.loginWithKakaoTalk();
      } else {
        await UserApi.instance.loginWithKakaoAccount();
      }
      // 2. 사용자 정보 취득
      final kakaoUser = await UserApi.instance.me();
      final phone = kakaoUser.kakaoAccount?.phoneNumber
              ?.replaceAll(RegExp(r'[^0-9]'), '') ??
          '';
      final kakaoId = kakaoUser.id.toString();
      final name = kakaoUser.kakaoAccount?.name ?? '';

      final email    = '${phone}@kakao.pilmart.com';
      final password = 'kko_${kakaoId}_pilmart';

      // 3. Supabase signIn → 실패 시 signUp
      try {
        await supabase.auth.signInWithPassword(email: email, password: password);
      } on AuthException {
        await supabase.auth.signUp(
          email: email,
          password: password,
          data: {'phone': phone, 'name': name, 'provider': 'kakao'},
        );
        await supabase.auth.signInWithPassword(email: email, password: password);
      }

      if (context.mounted) context.go('/home');
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('카카오 로그인 실패: $e')));
      }
    }
  }
}
```

- [ ] **Step 3: naver_auth_webview.dart 구현**

```dart
// lib/features/auth/naver_auth_webview.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:http/http.dart' as http;
import '../../core/constants.dart';
import '../../core/supabase_client.dart';

class NaverAuthWebView extends StatefulWidget {
  const NaverAuthWebView({super.key});
  @override
  State<NaverAuthWebView> createState() => _NaverAuthWebViewState();
}

class _NaverAuthWebViewState extends State<NaverAuthWebView> {
  late final WebViewController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (req) {
          if (req.url.startsWith(AppConstants.naverCallbackUrl)) {
            _handleCallback(req.url);
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ))
      ..loadRequest(Uri.parse(
        'https://nid.naver.com/oauth2.0/authorize'
        '?response_type=code'
        '&client_id=${AppConstants.naverClientId}'
        '&redirect_uri=${Uri.encodeComponent(AppConstants.naverCallbackUrl)}'
        '&state=pilmart',
      ));
  }

  Future<void> _handleCallback(String url) async {
    final uri = Uri.parse(url);
    final code = uri.queryParameters['code'] ?? '';
    // 토큰 교환은 Next.js API를 통해 수행 (client_secret 노출 방지)
    // POST /api/auth/naver-token { code } → { phone, naverId, name }
    try {
      final res = await http.post(
        Uri.parse('${AppConstants.nextJsBaseUrl}/api/auth/naver-token'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'code': code}),
      );
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final phone    = data['phone'] as String;
      final naverId  = data['naverId'] as String;
      final name     = data['name'] as String? ?? '';
      final email    = '${phone}@naver.pilmart.com';
      final password = 'nv_${naverId}_pilmart';

      try {
        await supabase.auth.signInWithPassword(email: email, password: password);
      } on AuthException {
        await supabase.auth.signUp(
          email: email,
          password: password,
          data: {'phone': phone, 'name': name, 'provider': 'naver'},
        );
        await supabase.auth.signInWithPassword(email: email, password: password);
      }
      if (mounted) context.go('/home');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('네이버 로그인 실패: $e')));
        Navigator.pop(context);
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('네이버 로그인')),
        body: WebViewWidget(controller: _ctrl),
      );
}
```

> `http` 패키지는 Task 1 pubspec.yaml에 이미 포함됨.

- [ ] **Step 4: main.dart에 KakaoSdk 초기화 추가**

```dart
// main.dart - Supabase.initialize 이후에 추가
import 'package:kakao_flutter_sdk_user/kakao_flutter_sdk_user.dart';
import 'core/constants.dart';

// void main() 내부:
KakaoSdk.init(nativeAppKey: AppConstants.kakaoAppKey);
```

- [ ] **Step 5: 에뮬레이터에서 카카오 버튼 탭 → 카카오 웹뷰/앱 이동 확인**

```powershell
flutter run --dart-define=KAKAO_APP_KEY=<your_key> ...
```

- [ ] **Step 6: 커밋**

```powershell
git add pilmart-flutter/
git commit -m "feat: 소셜 로그인 — 카카오 SDK + 네이버 OAuth WebView"
```

---

### Task 7: 관리자 인증 (Next.js Cookie)

**Files:**
- Modify: `lib/features/auth/admin_auth_provider.dart` (stub → 실제 구현)
- Create: `lib/features/auth/admin_login_page.dart`
- Test: `test/auth/admin_auth_provider_test.dart`

**Interfaces:**
- Consumes: `ApiClient.instance` (Dio), `SecureStorageService`
- Produces:
  - `adminSessionProvider` → `AdminSession?`
  - `AdminAuthNotifier.login(username, password)` → 성공 시 세션 저장
  - `AdminAuthNotifier.logout()`
  - `AdminAuthNotifier.restoreSession()` → GET /api/admin/session

- [ ] **Step 1: 단위 테스트 작성**

`test/auth/admin_auth_provider_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:pilmart_flutter/shared/models/admin_session.dart';

void main() {
  group('AdminSession', () {
    test('role별 접근 탭 확인', () {
      const superRoles  = ['super', 'product', 'order'];
      const productRoles = ['super', 'product'];
      const orderRoles  = ['super', 'order'];

      expect(superRoles.contains('super'),   isTrue);
      expect(productRoles.contains('order'), isFalse);
      expect(orderRoles.contains('product'), isFalse);
    });
  });
}
```

- [ ] **Step 2: 테스트 실행 → PASS**

```powershell
flutter test test/auth/admin_auth_provider_test.dart
```

- [ ] **Step 3: admin_auth_provider.dart 실제 구현**

```dart
// lib/features/auth/admin_auth_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../../core/secure_storage.dart';
import '../../shared/models/admin_session.dart';

class AdminAuthNotifier extends StateNotifier<AdminSession?> {
  final _storage = SecureStorageService();

  AdminAuthNotifier() : super(null) {
    restoreSession();
  }

  Future<void> restoreSession() async {
    final cookie = await _storage.getAdminCookie();
    if (cookie == null) return;
    try {
      final res = await ApiClient.instance.get('/api/admin/session');
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        state = AdminSession(
          username: data['username'] as String,
          role: data['role'] as String,
          cookie: cookie,
        );
      }
    } catch (_) {
      await _storage.deleteAdminCookie();
    }
  }

  Future<void> login(String username, String password) async {
    final res = await ApiClient.instance.post('/api/admin/login',
        data: {'username': username, 'password': password});
    if (res.statusCode == 200) {
      final cookie = await _storage.getAdminCookie(); // 인터셉터가 저장
      final data = res.data as Map<String, dynamic>;
      state = AdminSession(
        username: data['username'] as String? ?? username,
        role: data['role'] as String? ?? 'order',
        cookie: cookie ?? '',
      );
    } else {
      throw Exception('로그인 실패: ${res.statusCode}');
    }
  }

  Future<void> logout() async {
    try {
      await ApiClient.instance.post('/api/admin/logout');
    } catch (_) {}
    await _storage.deleteAdminCookie();
    state = null;
  }
}

final adminSessionProvider =
    StateNotifierProvider<AdminAuthNotifier, AdminSession?>(
        (_) => AdminAuthNotifier());
```

- [ ] **Step 4: admin_login_page.dart 구현**

```dart
// lib/features/auth/admin_login_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'admin_auth_provider.dart';

class AdminLoginPage extends ConsumerStatefulWidget {
  const AdminLoginPage({super.key});
  @override
  ConsumerState<AdminLoginPage> createState() => _AdminLoginPageState();
}

class _AdminLoginPageState extends ConsumerState<AdminLoginPage> {
  final _userCtrl = TextEditingController();
  final _pwCtrl   = TextEditingController();
  bool _loading   = false;

  Future<void> _login() async {
    setState(() => _loading = true);
    try {
      await ref.read(adminSessionProvider.notifier)
          .login(_userCtrl.text.trim(), _pwCtrl.text.trim());
      if (mounted) context.go('/admin/orders');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('관리자 로그인')),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(children: [
            const SizedBox(height: 48),
            TextField(controller: _userCtrl,
                decoration: const InputDecoration(labelText: '계정 ID')),
            const SizedBox(height: 12),
            TextField(controller: _pwCtrl,
                decoration: const InputDecoration(labelText: '비밀번호'),
                obscureText: true),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _login,
              child: _loading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('로그인'),
            ),
          ]),
        ),
      );
}
```

- [ ] **Step 5: app.dart의 `/admin/login` 플레이스홀더를 AdminLoginPage로 교체**

```dart
// 기존
GoRoute(path: '/admin/login', builder: (_, __) => const _PlaceholderPage('관리자 로그인')),
// 교체
GoRoute(path: '/admin/login', builder: (_, __) => const AdminLoginPage()),
```
`import 'features/auth/admin_login_page.dart';` 추가.

- [ ] **Step 6: Next.js 로컬 서버 기동 후 관리자 로그인 E2E 확인**

```powershell
# 별도 터미널에서 Next.js 실행
cd pilmart-next && pnpm dev

# Flutter 에뮬레이터에서 관리자 로그인 확인
# 로그인 화면 → ID: __super__ / PW: 1234 → /admin/orders 이동
```

- [ ] **Step 7: 커밋**

```powershell
git add pilmart-flutter/
git commit -m "feat: 관리자 인증 — Next.js Cookie 로그인/세션 복원/로그아웃"
```

---

## Phase 1 완료 기준

- [ ] `flutter analyze` — 0 errors, 0 warnings
- [ ] `flutter test` — 전체 테스트 PASS
- [ ] 에뮬레이터에서 앱 기동 → `/auth` 리다이렉트 확인
- [ ] 전화번호 로그인 후 `/home` placeholder 도달
- [ ] 카카오 버튼 탭 → 카카오 인증 화면 진입
- [ ] 관리자 로그인 후 `/admin/orders` placeholder + DrawerShell 확인
- [ ] 로그아웃 후 각각 `/auth`, `/admin/login` 리다이렉트 확인
