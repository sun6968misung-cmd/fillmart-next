# 필마트 Flutter 앱 설계 문서

**날짜:** 2026-09-10  
**플랫폼:** Android (iOS 후속)  
**상태:** 승인됨

---

## 1. 개요

필마트 고객용 Flutter 쇼핑 앱. 기존 Next.js 서버(Supabase 백엔드)를 그대로 재사용하고, 앱만의 차별점으로 FCM 푸시 알림을 추가한다.

**목표 기능:** 상품 목록·상세, 플래시세일, 카테고리, 검색, 장바구니, Toss 결제, 주문내역, 마이페이지, 찜 목록, 공지사항, 매장 정보, 카카오·네이버 소셜 로그인, FCM 주문/프로모션 푸시.

---

## 2. 프로젝트 구조

```
pilmart-flutter/
├── lib/
│   ├── core/
│   │   ├── api/
│   │   │   ├── api_client.dart            # Dio 인스턴스, baseUrl, 인터셉터
│   │   │   └── api_interceptor.dart       # Supabase JWT 자동 첨부, 에러 처리
│   │   ├── models/
│   │   │   ├── product.dart
│   │   │   ├── cart_item.dart
│   │   │   ├── order.dart
│   │   │   ├── notice.dart
│   │   │   ├── flash_sale_config.dart
│   │   │   ├── flash_product.dart
│   │   │   └── store_info.dart
│   │   ├── repositories/
│   │   │   ├── product_repository.dart    # Dio → /api/products, TTL 10분
│   │   │   ├── notice_repository.dart     # Dio → /api/notices
│   │   │   ├── flash_sale_repository.dart # Dio → /api/flash-sale, TTL 1분
│   │   │   ├── store_info_repository.dart # Dio → /api/store-info
│   │   │   ├── order_repository.dart      # Supabase 직접 (RLS)
│   │   │   └── profile_repository.dart    # Supabase 직접 (RLS)
│   │   ├── theme/
│   │   │   ├── app_theme.dart
│   │   │   └── app_colors.dart            # primary #1a3a5c, accent #e63946
│   │   └── utils/
│   │       ├── format.dart                # formatPrice, formatDate
│   │       └── constants.dart             # API base URL, Supabase URL/Key
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/auth_repository.dart
│   │   │   ├── providers/auth_provider.dart
│   │   │   └── presentation/
│   │   │       ├── login_page.dart
│   │   │       ├── register_page.dart     # Daum Postcode WebView 포함
│   │   │       └── widgets/
│   │   │           ├── social_login_buttons.dart
│   │   │           └── phone_field.dart
│   │   ├── home/
│   │   │   ├── data/home_repository.dart
│   │   │   ├── providers/home_provider.dart
│   │   │   └── presentation/
│   │   │       ├── home_page.dart
│   │   │       └── widgets/
│   │   │           ├── hero_banner.dart
│   │   │           ├── flash_sale_section.dart
│   │   │           ├── product_grid.dart
│   │   │           ├── notice_preview.dart
│   │   │           └── category_chips.dart
│   │   ├── product/
│   │   │   ├── data/
│   │   │   ├── providers/product_provider.dart
│   │   │   └── presentation/
│   │   │       ├── product_page.dart
│   │   │       └── widgets/product_card.dart
│   │   ├── flash_sale/
│   │   │   ├── data/
│   │   │   ├── providers/
│   │   │   └── presentation/flash_product_page.dart
│   │   ├── cart/
│   │   │   ├── data/cart_local_storage.dart
│   │   │   ├── providers/cart_provider.dart  # StateNotifier<List<CartItem>>
│   │   │   └── presentation/
│   │   │       ├── cart_page.dart
│   │   │       └── widgets/
│   │   │           ├── cart_item_tile.dart
│   │   │           └── order_summary_card.dart
│   │   ├── checkout/
│   │   │   ├── data/checkout_repository.dart
│   │   │   ├── providers/checkout_provider.dart
│   │   │   └── presentation/
│   │   │       ├── checkout_page.dart
│   │   │       ├── payment_page.dart
│   │   │       └── success_page.dart
│   │   ├── orders/
│   │   │   ├── data/
│   │   │   ├── providers/orders_provider.dart
│   │   │   └── presentation/
│   │   │       ├── orders_page.dart
│   │   │       └── widgets/
│   │   │           ├── order_card.dart
│   │   │           └── cancel_dialog.dart
│   │   ├── profile/
│   │   │   ├── data/
│   │   │   ├── providers/profile_provider.dart
│   │   │   └── presentation/
│   │   │       ├── profile_page.dart
│   │   │       ├── profile_edit_page.dart
│   │   │       ├── addresses_page.dart
│   │   │       └── widgets/address_edit_sheet.dart
│   │   ├── wishlist/
│   │   │   ├── data/
│   │   │   ├── providers/wishlist_provider.dart  # Supabase only (로그인 필수)
│   │   │   └── presentation/wishlist_page.dart
│   │   └── notice/
│   │       ├── data/
│   │       ├── providers/
│   │       └── presentation/
│   │           ├── notice_page.dart
│   │           └── notice_detail_page.dart
│   │
│   ├── router/
│   │   ├── app_router.dart                # @riverpod GoRouter
│   │   └── go_router_refresh_notifier.dart
│   └── main.dart
│
├── android/
│   └── app/src/main/
│       ├── AndroidManifest.xml
│       └── res/xml/network_security_config.xml
└── pubspec.yaml
```

---

## 3. 의존성 (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  supabase_flutter: ^2.9.1
  flutter_riverpod: ^2.6.1
  riverpod_annotation: ^2.6.1
  go_router: ^14.8.1
  tosspayments_widget_sdk_flutter: ^1.0.0
  kakao_flutter_sdk_user: ^1.9.9
  flutter_naver_login: ^1.8.0
  firebase_core: ^3.13.0
  firebase_messaging: ^15.2.5
  flutter_local_notifications: ^18.0.1
  dio: ^5.8.0+1
  cached_network_image: ^3.4.1
  shared_preferences: ^2.5.3
  flutter_secure_storage: ^9.0.0
  webview_flutter: ^4.11.0

dev_dependencies:
  build_runner: ^2.4.15
  riverpod_generator: ^2.6.5
  json_serializable: ^6.9.5
  flutter_lints: ^5.0.0
```

모든 provider는 `@riverpod` 어노테이션 방식으로 통일한다.

---

## 4. 라우트 (GoRouter, Next.js URL 동일)

| 경로 | 화면 | 인증 |
|---|---|---|
| `/` | HomePage | — |
| `/product/:id` | ProductPage | — |
| `/flash-sale/:id` | FlashProductPage | — |
| `/category/:slug` | CategoryPage | — |
| `/search` | SearchPage | — |
| `/cart` | CartPage | — |
| `/checkout` | CheckoutPage | ✅ |
| `/checkout/success` | SuccessPage | ✅ |
| `/checkout/fail` | FailPage | ✅ |
| `/orders` | OrdersPage | ✅ |
| `/orders/:id` | OrderDetailPage | ✅ |
| `/profile` | ProfilePage | ✅ |
| `/profile/edit` | ProfileEditPage | ✅ |
| `/profile/addresses` | AddressesPage | ✅ |
| `/wishlist` | WishlistPage | ✅ (미로그인 → `/auth`) |
| `/notice` | NoticePage | — |
| `/notice/:id` | NoticeDetailPage | — |
| `/store` | StorePage | — |
| `/auth` | LoginPage (`?redirect=` 지원) | — |

**GoRouter redirect 콜백 규칙:**
- 인증 필요 라우트 + 미로그인 → `/auth?redirect=<state.uri.toString() 인코딩>`
- 로그인 상태로 `/auth` 진입 → `redirect` 파라미터(검증 통과 시) 또는 `/`
- redirect 검증: `startsWith('/')` && `!startsWith('//')` && `!startsWith('/auth')`
- `refreshListenable`: `authStateProvider` 스트림 → `GoRouterRefreshNotifier` → 로그인/로그아웃 시 자동 재평가

---

## 5. 데이터 레이어

**두 데이터 소스:**

| 소스 | 대상 |
|---|---|
| `supabase_flutter` 직접 | `auth`, `orders`(RLS), `profiles`(RLS), `wishlist`(RLS), `device_tokens`(RLS) |
| Dio → Next.js `/api/...` | `products`, `notices`, `flash-sale`, `store-info`, `auth/social`, `auth/signup`, `checkout/create`, `confirm`, `orders/:id/cancel`, `device-tokens`, `push/order-status` |

**캐시 TTL:**
- `ProductRepository`: 10분. 앱 resume + pull-to-refresh 시 무효화.
- `FlashSaleRepository`: 1분.
- 나머지: 캐시 없음 (항상 최신).

**로컬 저장소:**
- 장바구니: `SharedPreferences` (JSON, 비로그인 포함)
- Supabase 세션: `supabase_flutter` 내장 (`flutter_secure_storage` 기반)

---

## 6. 인증 플로우

**일반 로그인:** `{phone}@pilmart.com` + 비밀번호 → `supabase.auth.signInWithPassword()`

**일반 회원가입:** 앱 → `POST /api/auth/signup` → 서버에서 `admin.createUser` + `profiles.upsert` → 앱에서 `signInWithPassword()`

**소셜 로그인:**
1. Kakao/Naver SDK → `accessToken` 획득
2. `POST /api/auth/social { provider, accessToken }` → 서버가 사용자 정보 조회, Supabase 계정 생성/로그인, `profiles.upsert`
3. 응답의 `{ supabase_access_token, supabase_refresh_token }` → `supabase.auth.setSession()`

**세션 복원:** `supabase_flutter` 자동 처리 (앱 재시작 시 `currentSession` 복원, 토큰 자동 갱신)

**currentUserProvider:**
```dart
final user = ref.watch(authStateProvider).value?.session?.user
    ?? supabase.auth.currentUser;
```

**로그아웃:**
1. `DELETE /api/device-tokens { fcm_token }` (FCM 토큰 서버 삭제)
2. KakaoSDK / NaverLogin SDK logout 호출 (소셜 로그인 시)
3. `supabase.auth.signOut()`
4. `ref.invalidate(wishlistProvider)`
5. GoRouter → `/`

---

## 7. 결제 플로우 (Toss)

```
1. CheckoutPage
   - profiles에서 기본 배송지 로드
   - "다른 배송지" → Daum Postcode WebView

2. POST /api/checkout/create
   요청: { items: [{productId, qty}], address }
   서버: 현재가 재계산(DB 기준) → orders INSERT (status: '주문완료')
   응답: { orderId, verifiedTotal }
   ※ status 값은 기존 웹 앱과 동일한 한국어 문자열 사용

3. PaymentPage (전체화면)
   PaymentWidget(
     clientKey: TOSS_CLIENT_KEY,
     customerKey: supabase_user_id,
     orderId, orderName,
     amount: Money(currency: Currency.KRW, value: verifiedTotal),
     successUrl: 'pilmart://checkout/success',
     failUrl:    'pilmart://checkout/fail',
   )

4. Toss 완료 → 딥링크 → SuccessPage
   - method.startsWith('meet') 이면 confirm 생략, 완료 처리
   - 그 외: POST /api/confirm { paymentKey, orderId, amount }
     서버: JWT 소유자 확인 → DB 금액 일치 → Toss 승인 API
            → status='paid', paymentKey 저장
            → 동일 orderId 재요청 시 기존 결과 반환(멱등)
   - 장바구니 초기화, ordersProvider 무효화
   - (최초 주문) FCM 권한 요청

5. 실패 → /checkout/fail → 안내 + 재시도 버튼
```

---

## 8. 주문 취소

`POST /api/orders/:id/cancel { itemId, quantity }`
- JWT로 주문 소유자 확인
- 취소 가능 상태: `pending` | `paid` | `preparing`
- Toss 결제 건: Toss 부분취소 API 호출 후 `order_items` 갱신
- 만나서 결제: 상태만 변경
- `shipping` | `delivered` | `cancelled`: "매장 문의" 응답 반환

---

## 9. 찜 목록

- **로그인 필수.** 미로그인 찜 버튼 탭 → `/auth?redirect=<현재경로>`
- Supabase `wishlist(user_id, product_id, created_at)` 테이블 (RLS: `user_id = auth.uid()`)
- 로그아웃 시 `ref.invalidate(wishlistProvider)` — 로컬 저장 없음

---

## 10. FCM 푸시 알림

**알림 채널 (앱 시작 시 생성):**

| 채널 ID | 중요도 | 용도 |
|---|---|---|
| `pilmart_orders` | high | 주문 상태 변경 |
| `pilmart_promo` | default | 프로모션 (동의자·21:00–08:00 제외·제목 앞 `(광고)`) |

**토큰 관리:**
- 로그인 후: `FCM.getToken()` → `POST /api/device-tokens`  upsert `(user_id, fcm_token, updated_at)`
- `onTokenRefresh`: 동일 API 재호출
- 로그아웃: `DELETE /api/device-tokens { fcm_token }`
- 테이블: `device_tokens(id, user_id, fcm_token, platform, created_at, updated_at)`, `UNIQUE(user_id, fcm_token)`

**수신 처리:**

| 상태 | 처리 |
|---|---|
| 포그라운드 | `onMessage` → `flutter_local_notifications` 로컬 알림 표시 |
| 백그라운드 | 시스템 알림 자동 표시 |
| 종료 | `getInitialMessage()` → 앱 실행 후 딥링크 |

세 경로 모두 `message.data['path']` → GoRouter.go(), `message.data['orderId']` → `ordersProvider` 무효화.

**알림 권한:** SuccessPage 최초 주문 완료 시 요청. 거절 시 ProfilePage에 `openAppSettings` 버튼.

**서버 발송 (`firebase-admin`):**
- Supabase Webhook: `orders.status` 변경 → `POST /api/push/order-status`
- status 문구 매핑:

| status | 알림 본문 |
|---|---|
| `paid` | 결제가 완료되었습니다. |
| `preparing` | 주문 상품을 준비 중입니다. |
| `shipping` | 배송이 시작되었습니다. |
| `delivered` | 배송이 완료되었습니다. |
| `cancelled` | 주문이 취소되었습니다. |

- `data`: `{ orderId, type: 'order_status', path: '/orders/<orderId>' }`
- 만료 토큰(404/410) → `device_tokens`에서 자동 삭제

---

## 11. Android 설정

**AndroidManifest.xml**
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<application android:networkSecurityConfig="@xml/network_security_config">
  <!-- App Links -->
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW"/>
    <category android:name="android.intent.category.DEFAULT"/>
    <category android:name="android.intent.category.BROWSABLE"/>
    <data android:scheme="https" android:host="pilmart.com"/>
  </intent-filter>
  <!-- Toss 결제 콜백 -->
  <intent-filter>
    <action android:name="android.intent.action.VIEW"/>
    <category android:name="android.intent.category.DEFAULT"/>
    <category android:name="android.intent.category.BROWSABLE"/>
    <data android:scheme="pilmart"/>
  </intent-filter>
  <!-- FCM 채널 -->
  <meta-data android:name="com.google.firebase.messaging.default_notification_channel_id"
             android:value="pilmart_orders"/>
</application>
```

**network_security_config.xml** — 프로덕션 HTTPS 강제, 로컬 개발(`10.0.2.2`, `localhost`)만 cleartext 허용.

**assetlinks.json** → `pilmart-next/public/.well-known/assetlinks.json`  
패키지명: `com.pilmart.app`, SHA-256: 릴리즈 키스토어 지문.

---

## 12. 신규 Next.js 엔드포인트

| 엔드포인트 | 인증 | 설명 |
|---|---|---|
| `POST /api/auth/social` | 공개 | 소셜 accessToken → Supabase 세션 반환 |
| `POST /api/checkout/create` | Supabase JWT | 가격 재계산 + pending 주문 생성 |
| `POST /api/confirm` | Supabase JWT | Toss 승인, 멱등, 금액·소유자 검증 |
| `POST /api/orders/:id/cancel` | Supabase JWT | 품목 취소, Toss 부분취소 |
| `POST /api/device-tokens` | Supabase JWT | FCM 토큰 upsert |
| `DELETE /api/device-tokens` | Supabase JWT | FCM 토큰 삭제 |
| `POST /api/push/order-status` | Supabase Webhook Secret | 주문 상태 FCM 발송 |

---

## 13. 신규 Supabase 테이블

```sql
-- 찜 목록
CREATE TABLE wishlist (
  user_id    uuid REFERENCES auth.users NOT NULL,
  product_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wishlist_own" ON wishlist USING (user_id = auth.uid());

-- FCM 디바이스 토큰
CREATE TABLE device_tokens (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users NOT NULL,
  fcm_token  text NOT NULL,
  platform   text DEFAULT 'android',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, fcm_token)
);
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tokens_own" ON device_tokens USING (user_id = auth.uid());

-- profiles 추가 컬럼
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS marketing_push_consent    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_push_consent_at timestamptz;
```
