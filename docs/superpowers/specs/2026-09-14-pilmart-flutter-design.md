# 필마트 Flutter 앱 설계 문서

**작성일:** 2026-09-14  
**대상 프로젝트:** `pilmart-flutter/`  
**연관 프로젝트:** `pilmart-next/` (Next.js + Supabase 백엔드)

---

## 개요

필마트 쇼핑몰의 Android/iOS 네이티브 앱. 고객 쇼핑 앱과 관리자 운영 앱을 **하나의 Flutter 프로젝트**로 구현하며, 로그인 계정 유형에 따라 UI를 분기한다.

### 선택한 아키텍처 (A안)

- **고객 기능:** Flutter → Supabase Dart SDK (anon key + RLS 직접 통신)  
- **관리자 기능:** Flutter → Next.js `/api/admin/*` API (Dio + Cookie)  
- 이유: Service Role Key 앱 노출 없음, 기존 Next.js 관리자 API 재사용, 보안 로직 서버 집중

### 지원 플랫폼

Android + iOS 동시 (단일 Flutter 코드베이스)

---

## 섹션 1: 프로젝트 구조 & 상태 관리

### 폴더 구조 (Feature-first)

```
pilmart-flutter/
├── lib/
│   ├── main.dart
│   ├── app.dart                  # MaterialApp + GoRouter 설정
│   ├── core/
│   │   ├── supabase_client.dart  # Supabase 초기화
│   │   ├── api_client.dart       # Next.js API HTTP 클라이언트 (관리자용)
│   │   ├── secure_storage.dart   # flutter_secure_storage 래퍼
│   │   └── constants.dart        # URL, 키 등
│   ├── features/
│   │   ├── auth/                 # 로그인 (고객 + 관리자 분기)
│   │   ├── home/                 # 홈, 카테고리, 플래시세일
│   │   ├── product/              # 상품 목록 / 상세
│   │   ├── cart/                 # 장바구니
│   │   ├── checkout/             # 결제 + Toss WebView
│   │   ├── orders/               # 주문 내역 (고객)
│   │   ├── wishlist/             # 찜 목록
│   │   ├── profile/              # 마이페이지
│   │   ├── notice/               # 공지사항
│   │   └── admin/                # 관리자 전체 (주문·상품·회원·공지·통계)
│   └── shared/
│       ├── models/               # Dart 데이터 모델
│       ├── widgets/              # 공통 위젯
│       └── theme/                # 색상·텍스트 스타일
├── pubspec.yaml
└── ...
```

### 상태 관리: Riverpod 2.x

- `@riverpod` 코드젠 방식 — 보일러플레이트 최소화
- Supabase 스트림 → `StreamProvider`로 실시간 반영
- 장바구니·찜 → `NotifierProvider` (로컬 상태 + Supabase 싱크)
- 관리자 세션 → `StateNotifierProvider` (Next.js 쿠키 토큰 보관)

### 주요 패키지

| 역할 | 패키지 |
|---|---|
| 상태관리 | `flutter_riverpod` + `riverpod_annotation` |
| 라우팅 | `go_router` |
| Supabase | `supabase_flutter` |
| HTTP (Admin API) | `dio` |
| 보안 스토리지 | `flutter_secure_storage` |
| WebView (Toss, 다음주소, 네이버OAuth) | `webview_flutter` |
| 카카오 로그인 | `kakao_flutter_sdk_user` |
| FCM | `firebase_messaging` |
| 이미지 캐시 | `cached_network_image` |
| 외부 앱 오픈 | `url_launcher` |

### pubspec.yaml 핵심 의존성

```yaml
dependencies:
  flutter_riverpod: ^2.6
  riverpod_annotation: ^2.6
  go_router: ^14.0
  supabase_flutter: ^2.8
  dio: ^5.7
  flutter_secure_storage: ^9.2
  webview_flutter: ^4.10
  kakao_flutter_sdk_user: ^1.9
  firebase_core: ^3.6
  firebase_messaging: ^15.1
  cached_network_image: ^3.4
  url_launcher: ^6.3
```

---

## 섹션 2: 인증 플로우 + 라우팅

### 앱 시작 시 인증 판별 흐름

```
앱 시작
  ├─ 1. SecureStorage에서 admin_cookie 확인
  │      └─ 존재 → GET /api/admin/session → 200 → 관리자 쉘
  └─ 2. Supabase onAuthStateChange 세션 확인
         ├─ 세션 있음 → 고객 쉘
         └─ 세션 없음 → 로그인 화면 (/auth)
```

### 고객 로그인 3가지

| 방식 | 구현 |
|---|---|
| 전화번호 + 비밀번호 | `supabase.auth.signInWithPassword(email: '{phone}@pilmart.com')` |
| 카카오 | `kakao_flutter_sdk_user` → 액세스 토큰 → `{phone}@kakao.pilmart.com` signIn/signUp |
| 네이버 | WebView OAuth → 액세스 토큰 → `{phone}@naver.pilmart.com` signIn/signUp |

카카오/네이버 email·password 규칙은 웹(Next.js)과 동일하게 유지해 계정 공유.

### 관리자 로그인

- 고객 로그인 화면 하단 소형 "관리자 로그인" 링크 → `/admin/login`
- `POST /api/admin/login` → Dio Interceptor가 `Set-Cookie` 수신 → `flutter_secure_storage`에 저장
- 이후 모든 `/api/admin/*` 호출 시 `Cookie: admin_session=…` 헤더 자동 주입
- 로그아웃: `POST /api/admin/logout` + SecureStorage 삭제

### GoRouter 구조

```
/                    → 세션 기반 리다이렉트
├── /auth            → 고객 로그인/회원가입
├── /admin/login     → 관리자 로그인
│
├── [고객 쉘 - BottomNavigationBar: 홈·카테고리·찜·주문·마이]
│   ├── /home
│   ├── /category/:slug
│   ├── /product/:id
│   ├── /flash-product/:idx
│   ├── /cart
│   ├── /checkout
│   ├── /checkout/payment        → Toss WebView
│   ├── /success
│   ├── /orders
│   ├── /orders/lookup
│   ├── /wishlist
│   ├── /profile
│   └── /notice
│
└── [관리자 쉘 - NavigationDrawer, 역할별 탭]
    ├── /admin/orders
    ├── /admin/products
    ├── /admin/flash-sale
    ├── /admin/notices
    ├── /admin/store-info
    ├── /admin/members
    ├── /admin/member/:phone
    ├── /admin/member/:phone/day/:date
    ├── /admin/accounts          → super 전용
    └── /admin/logs              → super 전용
```

### GoRouter Redirect 규칙

| 조건 | 동작 |
|---|---|
| 미인증 → `/home` 이하 접근 | `/auth`로 리다이렉트 |
| admin_cookie 없음 → `/admin` 이하 접근 | `/admin/login`으로 리다이렉트 |
| 고객 로그인 완료 | `/home` |
| 관리자 로그인 완료 | `/admin/orders` |
| FCM 딥링크 (order) | `/orders?orderId=…` |
| FCM 딥링크 (new_order, 관리자) | `/admin/orders` |

---

## 섹션 3: 고객 앱 화면 상세

### 쉘: Bottom Navigation Bar 5탭

`홈 | 카테고리 | 찜 | 주문 | 마이`

### 홈 (`/home`)

- PageView 히어로 배너 (자동 슬라이드)
- 플래시세일 섹션: `start_hour ≤ 현재시각 < end_hour` 일 때만 노출, 카운트다운 타이머
- 상품 그리드: Supabase `products` + `product_overrides` 머지, 섹션별 노출
- 우상단 검색 아이콘

### 카테고리 (`/category/:slug`)

- 카테고리 칩 가로 스크롤 (야채/채소, 과일, 축산/계란, 수산/건어물, 라면/면류, 유제품/냉장/냉동, 캔/통조림)
- 선택 카테고리 상품 2열 그리드
- Supabase `products` WHERE `category = slug AND NOT is_hidden`

### 상품 상세 (`/product/:id`)

- 상품 이미지·이름·가격
- `taxType = 'tax'` 이면 공급가/부가세 분리 뱃지
- 찜 버튼 → Supabase `wishlists` 토글
- 수량 선택 + 장바구니 담기
- 탭: 상품정보 / 배송안내

### 장바구니 (`/cart`)

- 아이템 목록 + 수량 조절 + 삭제
- 과세/면세 합계 분리 표시
- 결제하기 → `/checkout` (미로그인 시 `/auth`)

### 결제 (`/checkout`)

- Supabase `profiles`에서 기본 배송지 자동 로드
- 배송 메모 입력
- 결제 수단: 온라인카드 / 계좌이체 / 만나서카드 / 만나서현금
- 결제하기 → `POST /api/orders/pending` → `orderId` 수신
  - 온라인 → `/checkout/payment` (Toss WebView)
  - 만나서 → 바로 `POST /api/payments/confirm` → `/success`

### Toss WebView (`/checkout/payment`)

```
WebViewController
  onNavigationRequest: URL 패턴 감지
    successUrl 패턴 → push('/success?paymentKey=…&orderId=…&amount=…')
    failUrl 패턴    → push('/fail')
    intent:// / kakaobank:// 등 딥링크 → url_launcher로 외부 앱 오픈
```

### 주문 내역 (`/orders`)

- Supabase `orders` WHERE `user_id = auth.uid()` ORDER BY `created_at DESC`
- 상태 뱃지 색상:
  - 결제대기 → 회색
  - 주문완료 → 파랑
  - 배송준비중 → 주황
  - 배송중 → 초록
  - 배송완료 → 초록(진)
  - 취소완료 → 빨강
- 부분취소: 배송완료·취소완료 제외 → Supabase UPDATE `{ cancelled_items, total_amount }`

### 찜 목록 (`/wishlist`)

- Supabase `wishlists` JOIN `products` StreamProvider
- 상품 카드 탭 → `/product/:id`
- 찜 해제 버튼

### 마이페이지 (`/profile`)

- `profiles` 조회: 이름·전화·배송지
- 배송지 수정: 다음 우편번호 WebView (`https://postcode.map.daum.net/guide`) → 주소 파싱 후 `UPDATE profiles`
- 사업자 정보: `user_type = 'business'` 이면 사업자번호·상호·업태·종목 표시
- 로그아웃 → `supabase.auth.signOut()`

### 공지사항 (`/notice`)

- Supabase `notices` 목록
- ExpansionTile으로 제목 탭 시 내용 펼침

---

## 섹션 4: 관리자 앱 화면 상세

### 쉘: NavigationDrawer (역할별 탭 표시)

| 역할 | 표시 탭 |
|---|---|
| super | 주문·상품·특가·공지·매장정보·회원·계정·로그 |
| product | 주문·상품·특가 |
| order | 주문 |

드로어 헤더: 로그인 계정명 + 역할 뱃지 + 로그아웃 버튼

### 주문 관리 (`/admin/orders`)

- `GET /api/admin/orders` (Dio + Cookie)
- 상태 필터 칩: 전체 / 결제완료 / 준비중 / 배송중 / 완료 / 취소
- 주문 카드: 주문번호·고객명·금액·상태 뱃지·시간
- 상태 변경: 드롭다운 → `PATCH /api/admin/orders` (DB 한글 값 전송)
  - DB 상태값: `주문완료 / 배송준비중 / 배송중 / 배송완료 / 취소완료`
- 주문 삭제: 인라인 확인 버튼 (window.confirm 없음)
- 주문 상세 바텀시트: 항목 리스트·배송지·결제수단, 상태 변경 버튼
- FCM 수신 시 목록 자동 새로고침

### 상품 관리 (`/admin/products`)

- `GET /api/products` → overrides + custom products 머지
- 기본 상품(앱 내 PRODUCTS 정적 배열) + 커스텀 상품 구분 표시
- 오버라이드 수정: `PATCH /api/products`
- 커스텀 상품 추가: `POST /api/products`
- 숨김/노출 토글: `DELETE /api/products?action=hide|show`
- 커스텀 상품 삭제: `DELETE /api/products?action=remove`

### 특가 관리 (`/admin/flash-sale`)

- `GET /api/flash-sale` 현재 설정 조회
- 시작·종료 시간 TimePickerSpinner
- 특가 상품 추가/삭제 (이름·가격·재고·인당제한)
- 저장 → `POST /api/flash-sale`

### 공지 관리 (`/admin/notices`)

- `GET /api/notices` 목록
- 추가: `POST /api/notices`
- 삭제: 인라인 확인 → `DELETE /api/notices`

### 매장 정보 (`/admin/store-info`)

- `GET /api/store-info` 조회
- 매장명·전화·주소·영업시간 수정 → `POST /api/store-info`

### 회원 관리 (`/admin/members`)

- `GET /api/admin/members` (전화번호·이름·가입일·provider)
- 회원 삭제: 인라인 확인 → `DELETE /api/admin/members`
- 회원 카드 탭 → `/admin/member/:phone`

**회원 상세 (`/admin/member/:phone`):**
- 프로필 카드 + 일별 주문 요약 리스트
- 날짜 탭 → `/admin/member/:phone/day/:date` (주문 카드 목록)

### 계정 관리 (`/admin/accounts`) — super 전용

- `GET /api/admin/accounts` 목록
- 계정 추가: `POST /api/admin/accounts`
- 본인 비밀번호 변경: `PATCH /api/admin/accounts` `{ selfPw: true, newPassword }`
- 계정 삭제: `DELETE /api/admin/accounts`

### 감사 로그 (`/admin/logs`) — super 전용

- `GET /api/admin/logs` 최근 500건
- 시간·행위자·액션·대상 표시, 새로고침 버튼만

---

## 섹션 5: FCM 푸시 + 데이터 모델

### FCM 푸시 알림 발송 시점

| 이벤트 | 수신자 | 메시지 |
|---|---|---|
| 주문 상태 → 배송준비중 | 해당 고객 | "주문이 준비되고 있어요 📦" |
| 주문 상태 → 배송중 | 해당 고객 | "배송이 시작됐어요 🚚" |
| 주문 상태 → 배송완료 | 해당 고객 | "배송이 완료됐어요 ✅" |
| 새 주문 접수 | admin_accounts 전체 | "새 주문이 들어왔어요 🛒" |

발송 주체: Next.js `PATCH /api/admin/orders` 핸들러 내부에서 FCM Admin SDK 호출.

### Flutter FCM 처리

```dart
// 포그라운드
FirebaseMessaging.onMessage → SnackBar 또는 InAppNotification 위젯

// 백그라운드/종료 후 탭
FirebaseMessaging.onMessageOpenedApp → GoRouter 딥링크
  data.type == 'order'     → /orders?orderId=…      (고객)
  data.type == 'new_order' → /admin/orders           (관리자)
```

### FCM 토큰 등록 흐름

- 고객 로그인 완료 → `PATCH /api/profile` `{ fcm_token }` → `profiles.fcm_token` 저장
- 관리자 로그인 완료 → `POST /api/admin/fcm` `{ fcm_token }` → `admin_accounts.fcm_token` 저장
- 로그아웃 시 → 각 테이블 `fcm_token = null` 업데이트

### Supabase 마이그레이션 추가

**`005_fcm_tokens.sql`:**
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fcm_token TEXT;

ALTER TABLE public.admin_accounts
  ADD COLUMN IF NOT EXISTS fcm_token TEXT;
```

### 핵심 Dart 데이터 모델

```dart
class Product {
  final String id, name, category, unit, taxType;
  final int price;
  final String? imageUrl, description;
  final bool isHidden, isFlash;
}

class OrderItem {
  final String id, name;
  final int price, qty;
  final String taxType;
}

class Order {
  final String id, orderKey, status;
  final String? userId, customerName, deliveryAddress, paymentMethod;
  final int totalAmount, vatAmount;
  final List<OrderItem> items;
  final DateTime createdAt;
  final List<OrderItem>? cancelledItems;
}

class Profile {
  final String id, phone, name;
  final String? address, provider, fcmToken;
  final String userType; // 'personal' | 'business'
}

class WishlistItem {
  final String productId;
  final Product product;
}

class AdminSession {
  final String username, role, cookie;
}
```

---

## 구현 순서 (권장)

1. **Flutter 프로젝트 초기화** — `flutter create pilmart_flutter`, pubspec.yaml 설정
2. **Core 레이어** — Supabase 초기화, Dio + Cookie Interceptor, SecureStorage 래퍼
3. **인증** — 고객 로그인(전화번호·카카오·네이버), 관리자 로그인, GoRouter redirect
4. **고객 앱 기본 화면** — 홈·카테고리·상품상세·장바구니
5. **결제 플로우** — checkout → Toss WebView → success
6. **고객 앱 나머지** — 주문내역·찜·마이페이지·공지
7. **관리자 앱** — 주문관리 → 상품관리 → 나머지 탭
8. **FCM** — Firebase 설정, 토큰 등록, 알림 처리, Next.js 발송 로직 추가
9. **Supabase 마이그레이션** — `005_fcm_tokens.sql` 실행
10. **QA** — Android/iOS 동시 테스트, Toss 테스트 결제, FCM 딥링크

---

## 참고: Next.js API 엔드포인트 (관리자 Flutter에서 호출)

| 경로 | 메서드 | 용도 |
|---|---|---|
| `/api/admin/login` | POST | 관리자 로그인 (Cookie 발급) |
| `/api/admin/logout` | POST | 로그아웃 (Cookie 삭제) |
| `/api/admin/session` | GET | 세션 복원 |
| `/api/admin/orders` | GET/PATCH/DELETE | 주문 관리 |
| `/api/admin/members` | GET/DELETE | 회원 관리 |
| `/api/admin/accounts` | GET/POST/PATCH/DELETE | 관리자 계정 |
| `/api/admin/logs` | GET/POST | 감사 로그 |
| `/api/products` | GET/POST/PATCH/DELETE | 상품 관리 |
| `/api/notices` | GET/POST/DELETE | 공지 관리 |
| `/api/flash-sale` | GET/POST | 특가 관리 |
| `/api/store-info` | GET/POST | 매장 정보 |
| `/api/orders/pending` | POST | 결제 전 주문 생성 |
| `/api/payments/confirm` | POST | 결제 확인 |
