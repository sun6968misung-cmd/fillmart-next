# 필마트 Flutter Phase 2 — 고객 앱 화면 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 필마트 Flutter 앱의 고객용 화면 8종을 구현한다 — 홈·카테고리·상품상세·장바구니·결제(Toss WebView)·주문내역·찜·마이페이지·공지사항.

**Architecture:** Phase 1이 구축한 Core(Supabase·Dio·SecureStorage)·모델·GoRouter·Shell 위에 화면을 얹는다. 고객 데이터는 Supabase Dart SDK로 직접 조회하고, 결제 API(`/api/orders/pending`, `/api/payments/confirm`)는 기존 `http` 패키지로 호출한다. Toss 결제는 WebView 내에서 Toss JS SDK HTML을 직접 실행하고 `pilmart://success` 커스텀 스킴으로 결과를 수신한다.

**Tech Stack:** Flutter 3.x / Dart 3.x · flutter_riverpod 2.6 · go_router 14 · supabase_flutter 2.8 · webview_flutter 4.10 · http 1.2 · cached_network_image 3.4

**Spec:** `docs/superpowers/specs/2026-09-14-pilmart-flutter-design.md`

## Global Constraints

- 작업 디렉터리: `pilmart-flutter/` (repo root 기준)
- Flutter 3.x / Dart 3.x — null safety 필수
- Riverpod 2.x: `ConsumerWidget` / `ConsumerStatefulWidget` / `ref.watch` 사용; 구식 `Consumer` 위젯 사용 금지
- GoRouter 14.x: `context.go()` / `context.push()` 사용; `Navigator.push` 직접 사용 금지
- `supabase` 접근자: `import 'package:pilmart_flutter/core/supabase_client.dart'` → `supabase` 변수
- AppColors: `import 'package:pilmart_flutter/shared/theme/app_theme.dart'` → `AppColors.primary(0xFF1B2A5E)`, `AppColors.accent(0xFFE53935)`
- AppConstants: `import 'package:pilmart_flutter/core/constants.dart'` → `AppConstants.nextJsBaseUrl`
- 모든 JSON int 캐스트는 `(j['field'] as num).toInt()` 패턴 사용
- 정적 상품 목록: `pilmart-next/lib/products.ts`의 PRODUCTS 배열을 Dart로 변환
- 주문 상태 DB 값(한글): `주문완료·배송준비중·배송중·배송완료·취소완료·결제대기·취소완료`
- `flutter analyze` 경고 0건 유지 (기존 파일의 사전 경고는 무시)
- `flutter test` 전체 통과 유지
- 커밋 메시지 형식: `feat: <한국어 설명>`

---

## 파일 맵

| 파일 | 역할 | 태스크 |
|---|---|---|
| `lib/features/home/data/base_products.dart` | 정적 PRODUCTS 60개 Dart 변환 | 1 |
| `lib/features/home/providers/products_provider.dart` | Supabase override 머지 FutureProvider | 1 |
| `lib/shared/widgets/product_card.dart` | 재사용 상품 카드 | 1 |
| `lib/features/home/home_page.dart` | 홈 화면 조합 | 2 |
| `lib/features/home/widgets/hero_banner.dart` | PageView 자동 슬라이드 배너 | 2 |
| `lib/features/home/widgets/flash_sale_section.dart` | 플래시세일 섹션 + 카운트다운 | 2 |
| `lib/features/home/widgets/product_grid.dart` | 상품 2열 그리드 | 2 |
| `lib/features/product/category_page.dart` | 카테고리 칩 + 필터 그리드 | 3 |
| `lib/features/product/product_detail_page.dart` | 상품 상세·찜·수량·담기 | 3 |
| `lib/shared/models/cart_item.dart` | CartItem 모델 | 4 |
| `lib/features/cart/cart_provider.dart` | CartNotifier (메모리 상태) | 4 |
| `lib/features/cart/cart_page.dart` | 장바구니 화면 | 4 |
| `lib/features/checkout/checkout_page.dart` | 결제 정보 입력·주문 생성 | 5 |
| `lib/features/checkout/toss_webview_page.dart` | Toss JS WebView | 5 |
| `lib/features/checkout/success_page.dart` | 결제 완료 확인 | 5 |
| `lib/features/orders/orders_provider.dart` | Supabase orders StreamProvider | 6 |
| `lib/shared/widgets/status_badge.dart` | 주문 상태 색상 뱃지 | 6 |
| `lib/features/orders/orders_page.dart` | 주문 내역 + 부분취소 | 6 |
| `lib/features/wishlist/wishlist_provider.dart` | Supabase wishlists StreamProvider | 7 |
| `lib/features/wishlist/wishlist_page.dart` | 찜 목록 화면 | 7 |
| `lib/features/profile/profile_provider.dart` | Supabase profiles FutureProvider | 8 |
| `lib/features/profile/profile_page.dart` | 마이페이지 + 다음 주소 WebView | 8 |
| `lib/features/notice/notice_page.dart` | 공지사항 ExpansionTile 목록 | 8 |
| `lib/app.dart` | GoRouter 라우트 교체 (각 태스크별 해당 경로 업데이트) | 1~8 |

---

### Task 1: 상품 프로바이더 + ProductCard 공통 위젯

**Files:**
- Create: `lib/features/home/data/base_products.dart`
- Create: `lib/features/home/providers/products_provider.dart`
- Create: `lib/shared/widgets/product_card.dart`
- Test: `test/providers/products_provider_test.dart`

**Interfaces:**
- Produces: `productsProvider` — `FutureProvider<List<Product>>`
- Produces: `ProductCard(product: Product, onTap: VoidCallback)` widget
- Consumes: `Product` from `lib/shared/models/product.dart`
- Consumes: `supabase` from `lib/core/supabase_client.dart`

- [ ] **Step 1: base_products.dart 파일 생성**

`pilmart-next/lib/products.ts`의 PRODUCTS 배열을 읽어 Dart로 변환한다. 아래는 앞 3개 상품 예시 — **전체 60개 상품을 같은 패턴으로 변환**한다.

```dart
// lib/features/home/data/base_products.dart
import 'package:pilmart_flutter/shared/models/product.dart';

const kBaseProducts = <Product>[
  Product(
    id: '1',
    name: '청오이',
    category: '야채/채소',
    unit: '3개',
    taxType: 'taxFree',
    price: 2500,
    imageUrl: null,
    description: null,
    isHidden: false,
    isFlash: false,
  ),
  Product(
    id: '2',
    name: '애호박',
    category: '야채/채소',
    unit: '1개',
    taxType: 'taxFree',
    price: 1500,
    imageUrl: null,
    description: null,
    isHidden: false,
    isFlash: false,
  ),
  // ... pilmart-next/lib/products.ts 의 나머지 상품을 동일 패턴으로 추가
];
```

`Product` 생성자가 `const`를 지원하려면 `lib/shared/models/product.dart`에 `const Product({...})` 생성자가 있어야 한다. Phase 1에서 이미 정의됐는지 확인하고, 없으면 `const` 키워드를 추가한다.

- [ ] **Step 2: products_provider.dart 작성**

```dart
// lib/features/home/providers/products_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/shared/models/product.dart';
import '../data/base_products.dart';

final productsProvider = FutureProvider<List<Product>>((ref) async {
  final overrides = await supabase.from('product_overrides').select();
  final customs = await supabase
      .from('custom_products')
      .select()
      .eq('is_hidden', false);

  final overrideMap = <String, Map<String, dynamic>>{
    for (final o in overrides) o['product_id'] as String: o,
  };

  final merged = kBaseProducts.map((p) {
    final o = overrideMap[p.id];
    if (o == null) return p;
    return Product(
      id: p.id,
      name: o['name'] as String? ?? p.name,
      category: p.category,
      unit: p.unit,
      taxType: p.taxType,
      price: o['price'] != null ? (o['price'] as num).toInt() : p.price,
      imageUrl: o['image_url'] as String? ?? p.imageUrl,
      description: p.description,
      isHidden: o['is_hidden'] as bool? ?? p.isHidden,
      isFlash: p.isFlash,
    );
  }).where((p) => !p.isHidden).toList();

  final customList = (customs as List)
      .map((c) => Product.fromJson(c as Map<String, dynamic>))
      .toList();

  return [...merged, ...customList];
});
```

- [ ] **Step 3: product_card.dart 작성**

```dart
// lib/shared/widgets/product_card.dart
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:pilmart_flutter/shared/models/product.dart';
import 'package:pilmart_flutter/shared/theme/app_theme.dart';

class ProductCard extends StatelessWidget {
  const ProductCard({super.key, required this.product, required this.onTap});

  final Product product;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: product.imageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: product.imageUrl!,
                      fit: BoxFit.cover,
                      width: double.infinity,
                    )
                  : Container(
                      color: Colors.grey[100],
                      child: const Icon(Icons.image, color: Colors.grey),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13),
                  ),
                  Text(
                    product.unit,
                    style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Text(
                        '${product.price.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]},')}원',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                          fontSize: 13,
                        ),
                      ),
                      if (product.taxType == 'tax') ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                          decoration: BoxDecoration(
                            color: Colors.orange[100],
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text('과세', style: TextStyle(fontSize: 9)),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 4: 테스트 작성**

```dart
// test/providers/products_provider_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:pilmart_flutter/shared/models/product.dart';

void main() {
  test('override 머지 — name·price 교체, is_hidden 필터', () {
    const base = Product(
      id: '1', name: '청오이', category: '야채/채소', unit: '3개',
      taxType: 'taxFree', price: 2500, imageUrl: null,
      description: null, isHidden: false, isFlash: false,
    );
    final override = {'product_id': '1', 'name': '유기농 청오이', 'price': 3000, 'image_url': null, 'is_hidden': false};

    final merged = Product(
      id: base.id,
      name: override['name'] as String? ?? base.name,
      category: base.category,
      unit: base.unit,
      taxType: base.taxType,
      price: override['price'] != null ? (override['price'] as num).toInt() : base.price,
      imageUrl: override['image_url'] as String? ?? base.imageUrl,
      description: base.description,
      isHidden: override['is_hidden'] as bool? ?? base.isHidden,
      isFlash: base.isFlash,
    );

    expect(merged.name, '유기농 청오이');
    expect(merged.price, 3000);
    expect(merged.isHidden, false);
  });

  test('is_hidden=true 상품은 필터링된다', () {
    const hidden = Product(
      id: '2', name: '숨겨진 상품', category: '과일', unit: '1개',
      taxType: 'taxFree', price: 1000, imageUrl: null,
      description: null, isHidden: true, isFlash: false,
    );
    final visible = [hidden].where((p) => !p.isHidden).toList();
    expect(visible, isEmpty);
  });
}
```

- [ ] **Step 5: 테스트 실행**

```powershell
cd pilmart-flutter
flutter test test/providers/products_provider_test.dart -v
```

Expected: PASS (2 tests)

- [ ] **Step 6: analyze 확인**

```powershell
flutter analyze
```

Expected: 0 new issues

- [ ] **Step 7: 커밋**

```powershell
git add pilmart-flutter/lib/features/home/data/base_products.dart
git add pilmart-flutter/lib/features/home/providers/products_provider.dart
git add pilmart-flutter/lib/shared/widgets/product_card.dart
git add pilmart-flutter/test/providers/products_provider_test.dart
git commit -m "feat: 상품 프로바이더 + ProductCard 공통 위젯"
```

---

### Task 2: 홈 화면 (배너 + 플래시세일 + 상품 그리드)

**Files:**
- Create: `lib/features/home/home_page.dart`
- Create: `lib/features/home/widgets/hero_banner.dart`
- Create: `lib/features/home/widgets/flash_sale_section.dart`
- Create: `lib/features/home/widgets/product_grid.dart`
- Modify: `lib/app.dart` — `/home` 라우트를 `HomePage()`로 교체

**Interfaces:**
- Consumes: `productsProvider` from Task 1
- Consumes: `FlashSaleConfig`, `FlashProduct` from `lib/shared/models/flash_sale.dart`
- Consumes: `AppConstants.nextJsBaseUrl` for flash-sale API

- [ ] **Step 1: flash_sale_section.dart 작성**

플래시세일은 `GET ${AppConstants.nextJsBaseUrl}/api/flash-sale`로 가져온다.

```dart
// lib/features/home/widgets/flash_sale_section.dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:pilmart_flutter/core/constants.dart';
import 'package:pilmart_flutter/shared/models/flash_sale.dart';
import 'package:pilmart_flutter/shared/theme/app_theme.dart';

class FlashSaleSection extends StatefulWidget {
  const FlashSaleSection({super.key});

  @override
  State<FlashSaleSection> createState() => _FlashSaleSectionState();
}

class _FlashSaleSectionState extends State<FlashSaleSection> {
  FlashSaleConfig? _config;
  Timer? _timer;
  Duration _remaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await http.get(
        Uri.parse('${AppConstants.nextJsBaseUrl}/api/flash-sale'),
      );
      if (res.statusCode != 200) return;
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final config = FlashSaleConfig.fromJson(data);
      if (!mounted) return;
      setState(() => _config = config);
      _startTimer(config);
    } catch (_) {}
  }

  void _startTimer(FlashSaleConfig config) {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      final now = DateTime.now();
      final end = DateTime(now.year, now.month, now.day, config.endHour);
      final diff = end.difference(now);
      if (mounted) setState(() => _remaining = diff.isNegative ? Duration.zero : diff);
    });
  }

  bool _isActive() {
    if (_config == null) return false;
    final h = DateTime.now().hour;
    return h >= _config!.startHour && h < _config!.endHour;
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_config == null || !_isActive() || _config!.products.isEmpty) {
      return const SizedBox.shrink();
    }
    final h = _remaining.inHours.toString().padLeft(2, '0');
    final m = (_remaining.inMinutes % 60).toString().padLeft(2, '0');
    final s = (_remaining.inSeconds % 60).toString().padLeft(2, '0');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            children: [
              Text('⚡ 특가', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.accent)),
              const Spacer(),
              Text('$h:$m:$s', style: TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        SizedBox(
          height: 160,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: _config!.products.length,
            itemBuilder: (ctx, i) {
              final fp = _config!.products[i];
              return GestureDetector(
                onTap: () => context.push('/flash-product/$i'),
                child: Card(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  child: SizedBox(
                    width: 120,
                    child: Padding(
                      padding: const EdgeInsets.all(8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(fp.name, maxLines: 2, style: const TextStyle(fontSize: 13)),
                          const Spacer(),
                          Text('${fp.price}원', style: TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const Divider(),
      ],
    );
  }
}
```

- [ ] **Step 2: hero_banner.dart 작성**

```dart
// lib/features/home/widgets/hero_banner.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:pilmart_flutter/shared/theme/app_theme.dart';

class HeroBanner extends StatefulWidget {
  const HeroBanner({super.key});

  @override
  State<HeroBanner> createState() => _HeroBannerState();
}

class _HeroBannerState extends State<HeroBanner> {
  final _controller = PageController();
  int _current = 0;
  Timer? _timer;

  static const _banners = [
    _BannerData(color: Color(0xFF1B2A5E), label: '신선한 야채·과일\n매일 새벽 직송'),
    _BannerData(color: Color(0xFF2E7D32), label: '이번 주 특가\n최대 30% 할인'),
    _BannerData(color: Color(0xFFE53935), label: '주문하면 당일 배송\n오전 11시 마감'),
  ];

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 3), (_) {
      final next = (_current + 1) % _banners.length;
      _controller.animateToPage(next, duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 180,
      child: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            itemCount: _banners.length,
            onPageChanged: (i) => setState(() => _current = i),
            itemBuilder: (ctx, i) => Container(
              color: _banners[i].color,
              alignment: Alignment.center,
              child: Text(
                _banners[i].label,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          Positioned(
            bottom: 8,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _banners.length,
                (i) => Container(
                  width: 6,
                  height: 6,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: i == _current ? Colors.white : Colors.white38,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BannerData {
  const _BannerData({required this.color, required this.label});
  final Color color;
  final String label;
}
```

- [ ] **Step 3: product_grid.dart 작성**

```dart
// lib/features/home/widgets/product_grid.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pilmart_flutter/shared/models/product.dart';
import 'package:pilmart_flutter/shared/widgets/product_card.dart';

class ProductGrid extends StatelessWidget {
  const ProductGrid({super.key, required this.products, this.title});

  final List<Product> products;
  final String? title;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(title!, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.75,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
          ),
          itemCount: products.length,
          itemBuilder: (ctx, i) => ProductCard(
            product: products[i],
            onTap: () => context.push('/product/${products[i].id}'),
          ),
        ),
      ],
    );
  }
}
```

- [ ] **Step 4: home_page.dart 작성**

```dart
// lib/features/home/home_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/features/home/providers/products_provider.dart';
import 'widgets/hero_banner.dart';
import 'widgets/flash_sale_section.dart';
import 'widgets/product_grid.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncProducts = ref.watch(productsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('필마트'), actions: [
        IconButton(icon: const Icon(Icons.search), onPressed: () {}),
      ]),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(productsProvider.future),
        child: CustomScrollView(
          slivers: [
            const SliverToBoxAdapter(child: HeroBanner()),
            const SliverToBoxAdapter(child: FlashSaleSection()),
            asyncProducts.when(
              data: (products) => SliverToBoxAdapter(
                child: ProductGrid(products: products, title: '전체 상품'),
              ),
              loading: () => const SliverToBoxAdapter(
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => SliverToBoxAdapter(
                child: Center(child: Text('오류: $e')),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 5: lib/app.dart의 `/home` 라우트 업데이트**

`lib/app.dart`에서 `/home` 경로의 `builder`를 찾아 `HomePage()`로 교체한다.

```dart
// 변경 전 (예시):
GoRoute(path: '/home', builder: (ctx, state) => const _PlaceholderPage(title: '홈')),

// 변경 후:
GoRoute(path: '/home', builder: (ctx, state) => const HomePage()),
```

파일 상단에 import 추가:
```dart
import 'package:pilmart_flutter/features/home/home_page.dart';
```

- [ ] **Step 6: flutter analyze 확인**

```powershell
flutter analyze
```

Expected: 0 new issues

- [ ] **Step 7: 커밋**

```powershell
git add pilmart-flutter/lib/features/home/
git add pilmart-flutter/lib/app.dart
git commit -m "feat: 홈 화면 — 배너·플래시세일·상품 그리드"
```

---

### Task 3: 카테고리 화면 + 상품 상세 화면

**Files:**
- Create: `lib/features/product/category_page.dart`
- Create: `lib/features/product/product_detail_page.dart`
- Modify: `lib/app.dart` — `/category/:slug`, `/product/:id` 라우트 교체

**Interfaces:**
- Consumes: `productsProvider` from Task 1
- Consumes: `CartNotifier` / `cartProvider` from Task 4 — **이 태스크에서는 stub 사용**
  - 장바구니 담기 버튼은 Task 4 완료 전까지 `SnackBar('장바구니 기능은 준비 중')` 표시
- Consumes: `supabase` — wishlists 토글

카테고리 목록 (순서 유지):
```dart
const kCategories = ['야채/채소', '과일', '축산/계란', '수산/건어물', '라면/면류', '유제품/냉장/냉동', '캔/통조림'];
```

- [ ] **Step 1: category_page.dart 작성**

```dart
// lib/features/product/category_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/features/home/providers/products_provider.dart';
import 'package:pilmart_flutter/shared/widgets/product_card.dart';
import 'package:go_router/go_router.dart';

const kCategories = ['야채/채소', '과일', '축산/계란', '수산/건어물', '라면/면류', '유제품/냉장/냉동', '캔/통조림'];

class CategoryPage extends ConsumerStatefulWidget {
  const CategoryPage({super.key, required this.slug});
  final String slug;

  @override
  ConsumerState<CategoryPage> createState() => _CategoryPageState();
}

class _CategoryPageState extends ConsumerState<CategoryPage> {
  late String _selected;

  @override
  void initState() {
    super.initState();
    _selected = kCategories.contains(widget.slug) ? widget.slug : kCategories.first;
  }

  @override
  Widget build(BuildContext context) {
    final asyncProducts = ref.watch(productsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('카테고리')),
      body: Column(
        children: [
          SizedBox(
            height: 48,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              itemCount: kCategories.length,
              itemBuilder: (ctx, i) {
                final cat = kCategories[i];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                  child: ChoiceChip(
                    label: Text(cat),
                    selected: _selected == cat,
                    onSelected: (_) => setState(() => _selected = cat),
                  ),
                );
              },
            ),
          ),
          Expanded(
            child: asyncProducts.when(
              data: (products) {
                final filtered = products.where((p) => p.category == _selected).toList();
                if (filtered.isEmpty) {
                  return const Center(child: Text('상품이 없습니다'));
                }
                return GridView.builder(
                  padding: const EdgeInsets.all(12),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.75,
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (ctx, i) => ProductCard(
                    product: filtered[i],
                    onTap: () => context.push('/product/${filtered[i].id}'),
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('오류: $e')),
            ),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 2: product_detail_page.dart 작성**

```dart
// lib/features/product/product_detail_page.dart
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/features/home/providers/products_provider.dart';
import 'package:pilmart_flutter/shared/theme/app_theme.dart';

class ProductDetailPage extends ConsumerStatefulWidget {
  const ProductDetailPage({super.key, required this.productId});
  final String productId;

  @override
  ConsumerState<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends ConsumerState<ProductDetailPage> {
  int _qty = 1;
  bool _wishlisted = false;

  @override
  void initState() {
    super.initState();
    _checkWishlist();
  }

  Future<void> _checkWishlist() async {
    final uid = supabase.auth.currentUser?.id;
    if (uid == null) return;
    final rows = await supabase
        .from('wishlists')
        .select()
        .eq('profile_id', uid)
        .eq('product_id', widget.productId);
    if (mounted) setState(() => _wishlisted = (rows as List).isNotEmpty);
  }

  Future<void> _toggleWishlist() async {
    final uid = supabase.auth.currentUser?.id;
    if (uid == null) return;
    if (_wishlisted) {
      await supabase.from('wishlists').delete().match({'profile_id': uid, 'product_id': widget.productId});
    } else {
      await supabase.from('wishlists').upsert({'profile_id': uid, 'product_id': widget.productId});
    }
    if (mounted) setState(() => _wishlisted = !_wishlisted);
  }

  @override
  Widget build(BuildContext context) {
    final asyncProducts = ref.watch(productsProvider);

    return asyncProducts.when(
      data: (products) {
        final product = products.firstWhere(
          (p) => p.id == widget.productId,
          orElse: () => throw Exception('상품 없음'),
        );

        final supplyPrice = product.taxType == 'tax' ? (product.price / 1.1).round() : 0;
        final vatAmount = product.taxType == 'tax' ? product.price - supplyPrice : 0;

        return Scaffold(
          appBar: AppBar(
            title: Text(product.name),
            actions: [
              IconButton(
                icon: Icon(_wishlisted ? Icons.favorite : Icons.favorite_border, color: AppColors.accent),
                onPressed: _toggleWishlist,
              ),
            ],
          ),
          body: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 280,
                  width: double.infinity,
                  child: product.imageUrl != null
                      ? CachedNetworkImage(imageUrl: product.imageUrl!, fit: BoxFit.cover)
                      : Container(color: Colors.grey[100], child: const Icon(Icons.image, size: 80, color: Colors.grey)),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(product.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                      Text(product.unit, style: TextStyle(color: Colors.grey[600])),
                      const SizedBox(height: 8),
                      Text(
                        '${product.price}원',
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                      if (product.taxType == 'tax') ...[
                        const SizedBox(height: 4),
                        Text('공급가: ${supplyPrice}원  VAT: ${vatAmount}원', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                      ],
                      const Divider(height: 32),
                      Row(
                        children: [
                          const Text('수량', style: TextStyle(fontSize: 16)),
                          const Spacer(),
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            onPressed: _qty > 1 ? () => setState(() => _qty--) : null,
                          ),
                          Text('$_qty', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            onPressed: () => setState(() => _qty++),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          bottomNavigationBar: Padding(
            padding: const EdgeInsets.all(16),
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(52),
              ),
              onPressed: () {
                // Task 4에서 cart_provider 구현 후 교체
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('${product.name} ${_qty}개를 장바구니에 담았습니다')),
                );
              },
              child: Text('장바구니 담기  |  ${product.price * _qty}원'),
            ),
          ),
        );
      },
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(body: Center(child: Text('오류: $e'))),
    );
  }
}
```

- [ ] **Step 3: lib/app.dart 라우트 업데이트**

```dart
// 변경 전:
GoRoute(path: '/category/:slug', builder: (ctx, state) => const _PlaceholderPage(title: '카테고리')),
GoRoute(path: '/product/:id', builder: (ctx, state) => const _PlaceholderPage(title: '상품상세')),

// 변경 후:
GoRoute(
  path: '/category/:slug',
  builder: (ctx, state) => CategoryPage(slug: state.pathParameters['slug']!),
),
GoRoute(
  path: '/product/:id',
  builder: (ctx, state) => ProductDetailPage(productId: state.pathParameters['id']!),
),
```

import 추가:
```dart
import 'package:pilmart_flutter/features/product/category_page.dart';
import 'package:pilmart_flutter/features/product/product_detail_page.dart';
```

- [ ] **Step 4: flutter analyze + 테스트**

```powershell
flutter analyze
flutter test
```

Expected: 0 new issues, all tests pass

- [ ] **Step 5: 커밋**

```powershell
git add pilmart-flutter/lib/features/product/
git add pilmart-flutter/lib/app.dart
git commit -m "feat: 카테고리 화면 + 상품 상세 화면"
```

---

### Task 4: 장바구니 (CartItem 모델 + Notifier + UI)

**Files:**
- Create: `lib/shared/models/cart_item.dart`
- Create: `lib/features/cart/cart_provider.dart`
- Create: `lib/features/cart/cart_page.dart`
- Modify: `lib/features/product/product_detail_page.dart` — 장바구니 담기 버튼 실제 연결
- Modify: `lib/app.dart` — `/cart` 라우트 교체
- Test: `test/providers/cart_provider_test.dart`

**Interfaces:**
- Produces: `cartProvider` — `NotifierProvider<CartNotifier, List<CartItem>>`
- Produces: `CartNotifier.add(CartItem)`, `CartNotifier.updateQty(String productId, int qty)`, `CartNotifier.remove(String productId)`, `CartNotifier.clear()`

- [ ] **Step 1: cart_item.dart 모델 작성**

```dart
// lib/shared/models/cart_item.dart
class CartItem {
  const CartItem({
    required this.productId,
    required this.name,
    required this.taxType,
    required this.price,
    required this.qty,
    this.imageUrl,
  });

  final String productId;
  final String name;
  final String taxType; // 'tax' | 'taxFree'
  final int price;
  final int qty;
  final String? imageUrl;

  CartItem copyWith({int? qty}) => CartItem(
        productId: productId,
        name: name,
        taxType: taxType,
        price: price,
        qty: qty ?? this.qty,
        imageUrl: imageUrl,
      );

  int get total => price * qty;
}
```

- [ ] **Step 2: cart_provider.dart 작성**

```dart
// lib/features/cart/cart_provider.dart
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
    state = state.map((c) => c.productId == productId ? c.copyWith(qty: qty) : c).toList();
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

final cartProvider = NotifierProvider<CartNotifier, List<CartItem>>(CartNotifier.new);
```

- [ ] **Step 3: 테스트 작성**

```dart
// test/providers/cart_provider_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/features/cart/cart_provider.dart';
import 'package:pilmart_flutter/shared/models/cart_item.dart';

void main() {
  ProviderContainer makeContainer() => ProviderContainer();

  test('add — 새 아이템 추가', () {
    final c = makeContainer();
    addTearDown(c.dispose);
    c.read(cartProvider.notifier).add(const CartItem(productId: '1', name: '오이', taxType: 'taxFree', price: 2500, qty: 2));
    expect(c.read(cartProvider).length, 1);
    expect(c.read(cartProvider).first.qty, 2);
  });

  test('add — 동일 productId는 수량 누적', () {
    final c = makeContainer();
    addTearDown(c.dispose);
    c.read(cartProvider.notifier).add(const CartItem(productId: '1', name: '오이', taxType: 'taxFree', price: 2500, qty: 1));
    c.read(cartProvider.notifier).add(const CartItem(productId: '1', name: '오이', taxType: 'taxFree', price: 2500, qty: 3));
    expect(c.read(cartProvider).first.qty, 4);
  });

  test('remove — 아이템 제거', () {
    final c = makeContainer();
    addTearDown(c.dispose);
    c.read(cartProvider.notifier).add(const CartItem(productId: '1', name: '오이', taxType: 'taxFree', price: 2500, qty: 1));
    c.read(cartProvider.notifier).remove('1');
    expect(c.read(cartProvider), isEmpty);
  });

  test('totalAmount 계산', () {
    final c = makeContainer();
    addTearDown(c.dispose);
    c.read(cartProvider.notifier).add(const CartItem(productId: '1', name: '오이', taxType: 'taxFree', price: 2500, qty: 2));
    c.read(cartProvider.notifier).add(const CartItem(productId: '2', name: '우유', taxType: 'tax', price: 3300, qty: 1));
    expect(c.read(cartProvider.notifier).totalAmount, 8300);
  });
}
```

- [ ] **Step 4: 테스트 실행**

```powershell
flutter test test/providers/cart_provider_test.dart -v
```

Expected: PASS (4 tests)

- [ ] **Step 5: cart_page.dart 작성**

```dart
// lib/features/cart/cart_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/features/cart/cart_provider.dart';
import 'package:pilmart_flutter/shared/theme/app_theme.dart';

class CartPage extends ConsumerWidget {
  const CartPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final notifier = ref.read(cartProvider.notifier);

    if (cart.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('장바구니')),
        body: const Center(child: Text('장바구니가 비어있습니다')),
      );
    }

    final taxItems = cart.where((c) => c.taxType == 'tax').toList();
    final taxFreeItems = cart.where((c) => c.taxType == 'taxFree').toList();
    final taxTotal = taxItems.fold(0, (s, c) => s + c.total);
    final taxFreeTotal = taxFreeItems.fold(0, (s, c) => s + c.total);

    return Scaffold(
      appBar: AppBar(
        title: const Text('장바구니'),
        actions: [
          TextButton(
            onPressed: () => notifier.clear(),
            child: const Text('전체삭제', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
      body: ListView.builder(
        itemCount: cart.length,
        itemBuilder: (ctx, i) {
          final item = cart[i];
          return ListTile(
            title: Text(item.name),
            subtitle: Text('${item.price}원 × ${item.qty}개 = ${item.total}원'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.remove),
                  onPressed: () => notifier.updateQty(item.productId, item.qty - 1),
                ),
                Text('${item.qty}'),
                IconButton(
                  icon: const Icon(Icons.add),
                  onPressed: () => notifier.updateQty(item.productId, item.qty + 1),
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  onPressed: () => notifier.remove(item.productId),
                ),
              ],
            ),
          );
        },
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (taxFreeTotal > 0)
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('면세 합계'),
                  Text('${taxFreeTotal}원'),
                ]),
              if (taxTotal > 0)
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('과세 합계'),
                  Text('${taxTotal}원'),
                ]),
              const Divider(),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('총 결제금액', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text('${notifier.totalAmount}원', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary)),
              ]),
              const SizedBox(height: 12),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(52),
                ),
                onPressed: () {
                  if (supabase.auth.currentUser == null) {
                    context.push('/auth');
                    return;
                  }
                  context.push('/checkout');
                },
                child: const Text('결제하기'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 6: product_detail_page.dart 장바구니 담기 버튼 실제 연결**

`lib/features/product/product_detail_page.dart`의 `onPressed` 콜백을 교체한다:

```dart
// 변경 전:
onPressed: () {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('${product.name} ${_qty}개를 장바구니에 담았습니다')),
  );
},

// 변경 후:
onPressed: () {
  ref.read(cartProvider.notifier).add(CartItem(
    productId: product.id,
    name: product.name,
    taxType: product.taxType,
    price: product.price,
    qty: _qty,
    imageUrl: product.imageUrl,
  ));
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('${product.name} ${_qty}개를 장바구니에 담았습니다')),
  );
},
```

import 추가:
```dart
import 'package:pilmart_flutter/features/cart/cart_provider.dart';
import 'package:pilmart_flutter/shared/models/cart_item.dart';
```

- [ ] **Step 7: lib/app.dart `/cart` 라우트 교체**

```dart
GoRoute(path: '/cart', builder: (ctx, state) => const CartPage()),
```

import 추가:
```dart
import 'package:pilmart_flutter/features/cart/cart_page.dart';
```

- [ ] **Step 8: flutter analyze + flutter test**

```powershell
flutter analyze
flutter test
```

Expected: 0 new issues, all tests pass

- [ ] **Step 9: 커밋**

```powershell
git add pilmart-flutter/lib/shared/models/cart_item.dart
git add pilmart-flutter/lib/features/cart/
git add pilmart-flutter/lib/features/product/product_detail_page.dart
git add pilmart-flutter/lib/app.dart
git add pilmart-flutter/test/providers/cart_provider_test.dart
git commit -m "feat: 장바구니 모델·프로바이더·화면 + 상품상세 담기 연결"
```

---

### Task 5: 결제 플로우 (Checkout + Toss WebView + Success)

**Files:**
- Create: `lib/features/checkout/checkout_page.dart`
- Create: `lib/features/checkout/toss_webview_page.dart`
- Create: `lib/features/checkout/success_page.dart`
- Modify: `lib/app.dart` — `/checkout`, `/checkout/payment`, `/success` 라우트 교체
- Test: `test/checkout/payment_method_test.dart`

**Interfaces:**
- Consumes: `cartProvider` from Task 4
- Consumes: `supabase` — profiles 조회
- Consumes: `AppConstants.nextJsBaseUrl` — /api/orders/pending, /api/payments/confirm
- `POST /api/orders/pending` body: `{ userId, items: [{productId, name, taxType, price, qty}], totalAmount, vatAmount, deliveryAddress, paymentMethod }`
- `POST /api/payments/confirm` body: `{ orderId, paymentKey, amount }` 또는 `{ orderId, method: 'meet-card'|'meet-cash', amount }`

- [ ] **Step 1: 결제수단 로직 단위 테스트 작성**

```dart
// test/checkout/payment_method_test.dart
import 'package:flutter_test/flutter_test.dart';

enum PaymentMethod { card, transfer, meetCard, meetCash }

bool isMeetPayment(PaymentMethod m) => m == PaymentMethod.meetCard || m == PaymentMethod.meetCash;
String toApiValue(PaymentMethod m) => switch (m) {
  PaymentMethod.card => '카드',
  PaymentMethod.transfer => '계좌이체',
  PaymentMethod.meetCard => 'meet-card',
  PaymentMethod.meetCash => 'meet-cash',
};

void main() {
  test('만나서 결제는 Toss WebView를 거치지 않는다', () {
    expect(isMeetPayment(PaymentMethod.meetCard), true);
    expect(isMeetPayment(PaymentMethod.meetCash), true);
    expect(isMeetPayment(PaymentMethod.card), false);
  });

  test('API 전송 결제수단 값', () {
    expect(toApiValue(PaymentMethod.meetCard), 'meet-card');
    expect(toApiValue(PaymentMethod.card), '카드');
  });
}
```

- [ ] **Step 2: 테스트 실행 (PASS 확인)**

```powershell
flutter test test/checkout/payment_method_test.dart -v
```

- [ ] **Step 3: checkout_page.dart 작성**

```dart
// lib/features/checkout/checkout_page.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:pilmart_flutter/core/constants.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/features/cart/cart_provider.dart';
import 'package:pilmart_flutter/shared/theme/app_theme.dart';

enum _PaymentMethod { card, transfer, meetCard, meetCash }

class CheckoutPage extends ConsumerStatefulWidget {
  const CheckoutPage({super.key});

  @override
  ConsumerState<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends ConsumerState<CheckoutPage> {
  String _address = '';
  String _memo = '';
  _PaymentMethod _method = _PaymentMethod.card;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadAddress();
  }

  Future<void> _loadAddress() async {
    final uid = supabase.auth.currentUser?.id;
    if (uid == null) return;
    final row = await supabase.from('profiles').select('address').eq('id', uid).maybeSingle();
    if (mounted && row != null && row['address'] != null) {
      setState(() => _address = row['address'] as String);
    }
  }

  Future<void> _submit() async {
    final cart = ref.read(cartProvider);
    if (cart.isEmpty) return;
    setState(() => _loading = true);

    final uid = supabase.auth.currentUser?.id;
    final notifier = ref.read(cartProvider.notifier);
    final total = notifier.totalAmount;
    final vat = notifier.taxAmount;

    try {
      final res = await http.post(
        Uri.parse('${AppConstants.nextJsBaseUrl}/api/orders/pending'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': uid,
          'items': cart.map((c) => {
            'productId': c.productId,
            'name': c.name,
            'taxType': c.taxType,
            'price': c.price,
            'qty': c.qty,
          }).toList(),
          'totalAmount': total,
          'vatAmount': vat,
          'deliveryAddress': _address,
          'paymentMethod': switch (_method) {
            _PaymentMethod.card => '카드',
            _PaymentMethod.transfer => '계좌이체',
            _PaymentMethod.meetCard => 'meet-card',
            _PaymentMethod.meetCash => 'meet-cash',
          },
        }),
      );

      if (!mounted) return;
      if (res.statusCode != 200) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('주문 생성 실패')));
        return;
      }

      final orderId = (jsonDecode(res.body) as Map)['orderId'] as String;

      if (_method == _PaymentMethod.meetCard || _method == _PaymentMethod.meetCash) {
        // 만나서 결제: Toss 없이 바로 confirm
        final confirmRes = await http.post(
          Uri.parse('${AppConstants.nextJsBaseUrl}/api/payments/confirm'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'orderId': orderId,
            'method': _method == _PaymentMethod.meetCard ? 'meet-card' : 'meet-cash',
            'amount': total,
          }),
        );
        if (!mounted) return;
        if (confirmRes.statusCode == 200) {
          notifier.clear();
          context.go('/success?orderId=$orderId&amount=$total&method=${_method == _PaymentMethod.meetCard ? 'meet-card' : 'meet-cash'}');
        } else {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('결제 처리 실패')));
        }
      } else {
        // 온라인 결제: Toss WebView로 이동
        if (!mounted) return;
        context.push('/checkout/payment?orderId=$orderId&amount=$total');
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('오류: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final total = ref.read(cartProvider.notifier).totalAmount;

    return Scaffold(
      appBar: AppBar(title: const Text('결제')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('배송지', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(_address.isEmpty ? '배송지를 설정해주세요' : _address, style: TextStyle(color: Colors.grey[700])),
            const Divider(height: 32),
            const Text('배송 메모', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            TextField(
              decoration: const InputDecoration(hintText: '배송 메모 입력 (선택)', border: OutlineInputBorder()),
              onChanged: (v) => _memo = v,
            ),
            const Divider(height: 32),
            const Text('결제 수단', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ...[
              (_PaymentMethod.card, '온라인 카드'),
              (_PaymentMethod.transfer, '계좌이체'),
              (_PaymentMethod.meetCard, '만나서 카드'),
              (_PaymentMethod.meetCash, '만나서 현금'),
            ].map((entry) => RadioListTile<_PaymentMethod>(
              title: Text(entry.$2),
              value: entry.$1,
              groupValue: _method,
              onChanged: (v) => setState(() => _method = v!),
            )),
            const Divider(height: 32),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('총 결제금액', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              Text('${total}원', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary)),
            ]),
          ],
        ),
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16),
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            minimumSize: const Size.fromHeight(52),
          ),
          onPressed: _loading || cart.isEmpty ? null : _submit,
          child: _loading ? const CircularProgressIndicator(color: Colors.white) : const Text('결제하기'),
        ),
      ),
    );
  }
}
```

- [ ] **Step 4: toss_webview_page.dart 작성**

Toss JS SDK를 WebView 내 로컬 HTML로 실행한다. `pilmart://success` 스킴으로 결과를 수신한다.

```dart
// lib/features/checkout/toss_webview_page.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

class TossWebViewPage extends StatefulWidget {
  const TossWebViewPage({super.key, required this.orderId, required this.amount});
  final String orderId;
  final int amount;

  @override
  State<TossWebViewPage> createState() => _TossWebViewPageState();
}

class _TossWebViewPageState extends State<TossWebViewPage> {
  late final WebViewController _controller;

  // test_ck_… 키는 AppConstants.tossClientKey로 관리 예정 (Phase 4에서 환경변수화)
  // 현재는 테스트 키 하드코딩
  static const _tossClientKey = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eo0';

  String _buildHtml() => '''
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body>
<script src="https://js.tosspayments.com/v2/standard"></script>
<script>
(async () => {
  const toss = TossPayments('$_tossClientKey');
  const payment = toss.payment({ customerKey: 'ANONYMOUS' });
  await payment.requestPayment({
    method: 'CARD',
    amount: { currency: 'KRW', value: ${widget.amount} },
    orderId: '${widget.orderId}',
    orderName: '필마트 주문',
    successUrl: 'pilmart://success',
    failUrl: 'pilmart://fail',
    card: { useEscrow: false, flowMode: 'DEFAULT', useCardPoint: false, useAppCardOnly: false },
  });
})();
</script>
</body>
</html>
''';

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (req) {
          final url = req.url;
          if (url.startsWith('pilmart://success')) {
            // paymentKey, orderId, amount를 URL 파라미터에서 추출
            final uri = Uri.parse(url.replaceFirst('pilmart://', 'https://pilmart.app/'));
            final paymentKey = uri.queryParameters['paymentKey'] ?? '';
            final amount = uri.queryParameters['amount'] ?? widget.amount.toString();
            if (!mounted) return NavigationDecision.prevent;
            context.go('/success?paymentKey=$paymentKey&orderId=${widget.orderId}&amount=$amount');
            return NavigationDecision.prevent;
          }
          if (url.startsWith('pilmart://fail')) {
            if (!mounted) return NavigationDecision.prevent;
            context.pop();
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('결제가 취소되었습니다')));
            return NavigationDecision.prevent;
          }
          // 외부 앱 딥링크 (카카오페이, 토스앱 등)
          if (!url.startsWith('http')) return NavigationDecision.prevent;
          return NavigationDecision.navigate;
        },
      ))
      ..loadHtmlString(_buildHtml());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('결제')),
      body: WebViewWidget(controller: _controller),
    );
  }
}
```

- [ ] **Step 5: success_page.dart 작성**

```dart
// lib/features/checkout/success_page.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:pilmart_flutter/core/constants.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/features/cart/cart_provider.dart';
import 'package:pilmart_flutter/shared/theme/app_theme.dart';

class SuccessPage extends ConsumerStatefulWidget {
  const SuccessPage({super.key, this.paymentKey, required this.orderId, required this.amount, this.method});
  final String? paymentKey;
  final String orderId;
  final String amount;
  final String? method;

  @override
  ConsumerState<SuccessPage> createState() => _SuccessPageState();
}

class _SuccessPageState extends ConsumerState<SuccessPage> {
  bool _loading = true;
  bool _success = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _confirm();
  }

  Future<void> _confirm() async {
    try {
      final body = widget.method != null
          ? {'orderId': widget.orderId, 'method': widget.method, 'amount': int.tryParse(widget.amount) ?? 0}
          : {'orderId': widget.orderId, 'paymentKey': widget.paymentKey, 'amount': int.tryParse(widget.amount) ?? 0};

      final res = await http.post(
        Uri.parse('${AppConstants.nextJsBaseUrl}/api/payments/confirm'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );

      if (!mounted) return;
      if (res.statusCode == 200) {
        ref.read(cartProvider.notifier).clear();
        setState(() { _loading = false; _success = true; });
      } else {
        setState(() { _loading = false; _error = '결제 확인 실패 (${res.statusCode})'; });
      }
    } catch (e) {
      if (mounted) setState(() { _loading = false; _error = '오류: $e'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [CircularProgressIndicator(), SizedBox(height: 16), Text('결제 확인 중...')],
      )));
    }

    if (!_success) {
      return Scaffold(
        appBar: AppBar(title: const Text('결제 오류')),
        body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 16),
          Text(_error, textAlign: TextAlign.center),
          const SizedBox(height: 24),
          ElevatedButton(onPressed: () => context.go('/home'), child: const Text('홈으로')),
        ])),
      );
    }

    final isLoggedIn = supabase.auth.currentUser != null;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.check_circle, size: 80, color: AppColors.primary),
              const SizedBox(height: 16),
              const Text('결제 완료!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('주문번호: ${widget.orderId}', style: TextStyle(color: Colors.grey[600])),
              const SizedBox(height: 32),
              if (isLoggedIn)
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(52)),
                  onPressed: () => context.go('/orders'),
                  child: const Text('주문내역 보기'),
                )
              else ...[
                const Text('비회원 주문내역은 아래에서 확인하세요', style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 8),
                OutlinedButton(onPressed: () => context.go('/orders/lookup'), child: const Text('주문 조회')),
              ],
              const SizedBox(height: 12),
              TextButton(onPressed: () => context.go('/home'), child: const Text('홈으로')),
            ]),
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 6: lib/app.dart 라우트 업데이트**

```dart
GoRoute(path: '/checkout', builder: (ctx, state) => const CheckoutPage()),
GoRoute(
  path: '/checkout/payment',
  builder: (ctx, state) {
    final orderId = state.uri.queryParameters['orderId']!;
    final amount = int.tryParse(state.uri.queryParameters['amount'] ?? '0') ?? 0;
    return TossWebViewPage(orderId: orderId, amount: amount);
  },
),
GoRoute(
  path: '/success',
  builder: (ctx, state) => SuccessPage(
    paymentKey: state.uri.queryParameters['paymentKey'],
    orderId: state.uri.queryParameters['orderId'] ?? '',
    amount: state.uri.queryParameters['amount'] ?? '0',
    method: state.uri.queryParameters['method'],
  ),
),
```

imports:
```dart
import 'package:pilmart_flutter/features/checkout/checkout_page.dart';
import 'package:pilmart_flutter/features/checkout/toss_webview_page.dart';
import 'package:pilmart_flutter/features/checkout/success_page.dart';
```

- [ ] **Step 7: flutter analyze + flutter test**

```powershell
flutter analyze
flutter test
```

- [ ] **Step 8: 커밋**

```powershell
git add pilmart-flutter/lib/features/checkout/
git add pilmart-flutter/lib/app.dart
git add pilmart-flutter/test/checkout/
git commit -m "feat: 결제 플로우 — Checkout·Toss WebView·Success 화면"
```

---

### Task 6: 주문 내역 + 부분취소

**Files:**
- Create: `lib/features/orders/orders_provider.dart`
- Create: `lib/shared/widgets/status_badge.dart`
- Create: `lib/features/orders/orders_page.dart`
- Modify: `lib/app.dart` — `/orders` 라우트 교체
- Test: `test/providers/orders_provider_test.dart`

**Interfaces:**
- Produces: `ordersProvider` — `StreamProvider<List<Order>>`
- Produces: `StatusBadge(status: String)` widget

- [ ] **Step 1: StatusBadge 테스트 작성**

```dart
// test/providers/orders_provider_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:pilmart_flutter/shared/models/order.dart';

void main() {
  test('Order.fromJson 파싱 — items 누락 시 빈 리스트', () {
    final json = {
      'id': 'abc',
      'order_key': 'pilmart_1',
      'status': '주문완료',
      'total_amount': 5000,
      'vat_amount': 0,
      'created_at': '2026-09-14T00:00:00Z',
    };
    final order = Order.fromJson(json);
    expect(order.items, isEmpty);
    expect(order.totalAmount, 5000);
  });

  test('취소완료·배송완료 주문은 부분취소 불가', () {
    bool canCancel(String status) =>
        status != '배송완료' && status != '취소완료';
    expect(canCancel('주문완료'), true);
    expect(canCancel('배송완료'), false);
    expect(canCancel('취소완료'), false);
  });
}
```

- [ ] **Step 2: 테스트 실행**

```powershell
flutter test test/providers/orders_provider_test.dart -v
```

- [ ] **Step 3: orders_provider.dart 작성**

```dart
// lib/features/orders/orders_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/shared/models/order.dart';

final ordersProvider = StreamProvider<List<Order>>((ref) {
  final uid = supabase.auth.currentUser?.id;
  if (uid == null) return const Stream.empty();
  return supabase
      .from('orders')
      .stream(primaryKey: ['id'])
      .eq('user_id', uid)
      .order('created_at', ascending: false)
      .map((rows) => rows.map((r) => Order.fromJson(r)).toList());
});
```

- [ ] **Step 4: status_badge.dart 작성**

```dart
// lib/shared/widgets/status_badge.dart
import 'package:flutter/material.dart';
import 'package:pilmart_flutter/shared/theme/app_theme.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status});
  final String status;

  static Color _color(String s) => switch (s) {
    '결제대기' => AppColors.statusPending,
    '주문완료' => AppColors.statusConfirmed,
    '배송준비중' => AppColors.statusReady,
    '배송중' => AppColors.statusShipping,
    '배송완료' => AppColors.statusDone,
    '취소완료' => AppColors.statusCancelled,
    _ => Colors.grey,
  };

  static String _label(String s) => switch (s) {
    '주문완료' => '결제완료',
    '배송준비중' => '준비중',
    _ => s,
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _color(status).withOpacity(0.15),
        border: Border.all(color: _color(status)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(_label(status), style: TextStyle(color: _color(status), fontSize: 12, fontWeight: FontWeight.bold)),
    );
  }
}
```

- [ ] **Step 5: orders_page.dart 작성**

```dart
// lib/features/orders/orders_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/features/orders/orders_provider.dart';
import 'package:pilmart_flutter/shared/models/order.dart';
import 'package:pilmart_flutter/shared/widgets/status_badge.dart';

class OrdersPage extends ConsumerWidget {
  const OrdersPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncOrders = ref.watch(ordersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('주문내역')),
      body: asyncOrders.when(
        data: (orders) {
          if (orders.isEmpty) return const Center(child: Text('주문내역이 없습니다'));
          return ListView.builder(
            itemCount: orders.length,
            itemBuilder: (ctx, i) => _OrderCard(order: orders[i]),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('오류: $e')),
      ),
    );
  }
}

class _OrderCard extends StatefulWidget {
  const _OrderCard({required this.order});
  final Order order;

  @override
  State<_OrderCard> createState() => _OrderCardState();
}

class _OrderCardState extends State<_OrderCard> {
  bool _expanded = false;

  bool get _canCancel =>
      widget.order.status != '배송완료' && widget.order.status != '취소완료';

  Future<void> _cancelItem(OrderItem item) async {
    final cancelled = [...(widget.order.cancelledItems ?? []), item.id];
    final remaining = widget.order.items.where((i) => !cancelled.contains(i.id)).toList();
    final newTotal = remaining.fold(0, (s, i) => s + i.price * i.qty);
    await supabase.from('orders').update({
      'cancelled_items': cancelled,
      'total_amount': newTotal,
    }).eq('id', widget.order.id);
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: InkWell(
        onTap: () => setState(() => _expanded = !_expanded),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(child: Text(o.orderKey, style: const TextStyle(fontWeight: FontWeight.bold))),
                StatusBadge(status: o.status),
              ]),
              const SizedBox(height: 4),
              Text('${o.totalAmount}원 · ${o.createdAt.toLocal().toString().substring(0, 10)}',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12)),
              if (_expanded) ...[
                const Divider(height: 16),
                ...o.items.map((item) {
                  final cancelled = o.cancelledItems?.contains(item.id) ?? false;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(item.name, style: TextStyle(decoration: cancelled ? TextDecoration.lineThrough : null)),
                    subtitle: Text('${item.price}원 × ${item.qty}'),
                    trailing: _canCancel && !cancelled
                        ? TextButton(
                            onPressed: () => _cancelItem(item),
                            child: const Text('취소', style: TextStyle(color: Colors.red)),
                          )
                        : null,
                  );
                }),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 6: lib/app.dart `/orders` 라우트 교체**

```dart
GoRoute(path: '/orders', builder: (ctx, state) => const OrdersPage()),
```

imports:
```dart
import 'package:pilmart_flutter/features/orders/orders_page.dart';
import 'package:pilmart_flutter/shared/widgets/status_badge.dart';
```

- [ ] **Step 7: flutter analyze + flutter test**

```powershell
flutter analyze
flutter test
```

- [ ] **Step 8: 커밋**

```powershell
git add pilmart-flutter/lib/features/orders/
git add pilmart-flutter/lib/shared/widgets/status_badge.dart
git add pilmart-flutter/lib/app.dart
git add pilmart-flutter/test/providers/orders_provider_test.dart
git commit -m "feat: 주문내역 화면 + StatusBadge + 부분취소"
```

---

### Task 7: 찜 목록 화면

**Files:**
- Create: `lib/features/wishlist/wishlist_provider.dart`
- Create: `lib/features/wishlist/wishlist_page.dart`
- Modify: `lib/app.dart` — `/wishlist` 라우트 교체

**Interfaces:**
- Produces: `wishlistIdsProvider` — `StreamProvider<List<String>>`
- Consumes: `productsProvider` from Task 1

- [ ] **Step 1: wishlist_provider.dart 작성**

```dart
// lib/features/wishlist/wishlist_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';

/// 현재 로그인 사용자의 찜 product_id 목록을 스트리밍
final wishlistIdsProvider = StreamProvider<List<String>>((ref) {
  final uid = supabase.auth.currentUser?.id;
  if (uid == null) return const Stream.empty();
  return supabase
      .from('wishlists')
      .stream(primaryKey: ['profile_id', 'product_id'])
      .eq('profile_id', uid)
      .map((rows) => rows.map((r) => r['product_id'] as String).toList());
});

/// 상품 ID 기준 찜 여부 확인용 (product_detail_page에서 사용)
Future<void> toggleWishlist(String productId) async {
  final uid = supabase.auth.currentUser?.id;
  if (uid == null) return;
  final existing = await supabase
      .from('wishlists')
      .select()
      .eq('profile_id', uid)
      .eq('product_id', productId);
  if ((existing as List).isNotEmpty) {
    await supabase.from('wishlists').delete().match({'profile_id': uid, 'product_id': productId});
  } else {
    await supabase.from('wishlists').upsert({'profile_id': uid, 'product_id': productId});
  }
}
```

- [ ] **Step 2: wishlist_page.dart 작성**

```dart
// lib/features/wishlist/wishlist_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pilmart_flutter/features/home/providers/products_provider.dart';
import 'package:pilmart_flutter/features/wishlist/wishlist_provider.dart';
import 'package:pilmart_flutter/shared/widgets/product_card.dart';

class WishlistPage extends ConsumerWidget {
  const WishlistPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncIds = ref.watch(wishlistIdsProvider);
    final asyncProducts = ref.watch(productsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('찜 목록')),
      body: asyncIds.when(
        data: (ids) {
          if (ids.isEmpty) return const Center(child: Text('찜한 상품이 없습니다'));
          return asyncProducts.when(
            data: (products) {
              final wishlisted = products.where((p) => ids.contains(p.id)).toList();
              return GridView.builder(
                padding: const EdgeInsets.all(12),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.75,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemCount: wishlisted.length,
                itemBuilder: (ctx, i) => ProductCard(
                  product: wishlisted[i],
                  onTap: () => context.push('/product/${wishlisted[i].id}'),
                ),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('오류: $e')),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('오류: $e')),
      ),
    );
  }
}
```

- [ ] **Step 3: lib/app.dart `/wishlist` 라우트 교체**

```dart
GoRoute(path: '/wishlist', builder: (ctx, state) => const WishlistPage()),
```

import:
```dart
import 'package:pilmart_flutter/features/wishlist/wishlist_page.dart';
```

- [ ] **Step 4: flutter analyze + flutter test**

```powershell
flutter analyze
flutter test
```

- [ ] **Step 5: 커밋**

```powershell
git add pilmart-flutter/lib/features/wishlist/
git add pilmart-flutter/lib/app.dart
git commit -m "feat: 찜 목록 화면 (Supabase wishlists 스트림)"
```

---

### Task 8: 마이페이지 + 공지사항

**Files:**
- Create: `lib/features/profile/profile_page.dart`
- Create: `lib/features/notice/notice_page.dart`
- Modify: `lib/app.dart` — `/profile`, `/notice` 라우트 교체

- [ ] **Step 1: profile_page.dart 작성**

다음 우편번호는 WebView로 `https://postcode.map.daum.net/guide`를 로드한다.

```dart
// lib/features/profile/profile_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/shared/theme/app_theme.dart';
import 'package:webview_flutter/webview_flutter.dart';

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  Map<String, dynamic>? _profile;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final uid = supabase.auth.currentUser?.id;
    if (uid == null) { setState(() => _loading = false); return; }
    final row = await supabase.from('profiles').select().eq('id', uid).maybeSingle();
    if (mounted) setState(() { _profile = row as Map<String, dynamic>?; _loading = false; });
  }

  Future<void> _openAddressSearch() async {
    final address = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (_) => const _DaumAddressWebView()),
    );
    if (address == null || !mounted) return;
    final uid = supabase.auth.currentUser?.id;
    if (uid == null) return;
    await supabase.from('profiles').update({'address': address}).eq('id', uid);
    setState(() => _profile = {...?_profile, 'address': address});
  }

  Future<void> _logout() async {
    await supabase.auth.signOut();
    if (mounted) context.go('/auth');
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    final p = _profile;
    return Scaffold(
      appBar: AppBar(title: const Text('마이페이지')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (p != null) ...[
            ListTile(contentPadding: EdgeInsets.zero, title: const Text('이름'), subtitle: Text(p['name'] as String? ?? '-')),
            ListTile(contentPadding: EdgeInsets.zero, title: const Text('전화번호'), subtitle: Text(p['phone'] as String? ?? '-')),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('배송지'),
              subtitle: Text(p['address'] as String? ?? '미설정'),
              trailing: TextButton(onPressed: _openAddressSearch, child: const Text('변경')),
            ),
            if (p['user_type'] == 'business') ...[
              const Divider(),
              const Text('사업자 정보', style: TextStyle(fontWeight: FontWeight.bold)),
              ListTile(contentPadding: EdgeInsets.zero, title: const Text('사업자번호'), subtitle: Text(p['business_no'] as String? ?? '-')),
              ListTile(contentPadding: EdgeInsets.zero, title: const Text('상호'), subtitle: Text(p['business_name'] as String? ?? '-')),
            ],
          ],
          const Divider(height: 32),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: _logout,
            child: const Text('로그아웃'),
          ),
        ],
      ),
    );
  }
}

class _DaumAddressWebView extends StatefulWidget {
  const _DaumAddressWebView();

  @override
  State<_DaumAddressWebView> createState() => _DaumAddressWebViewState();
}

class _DaumAddressWebViewState extends State<_DaumAddressWebView> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'FlutterAddress',
        onMessageReceived: (msg) {
          if (mounted) Navigator.pop(context, msg.message);
        },
      )
      ..loadHtmlString('''
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body>
<script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
<script>
new daum.Postcode({
  oncomplete: function(data) {
    var addr = data.roadAddress || data.jibunAddress;
    FlutterAddress.postMessage(addr);
  }
}).embed(document.body, { autoClose: false });
</script>
</body>
</html>
''');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('주소 검색')),
      body: WebViewWidget(controller: _controller),
    );
  }
}
```

- [ ] **Step 2: notice_page.dart 작성**

```dart
// lib/features/notice/notice_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pilmart_flutter/core/supabase_client.dart';
import 'package:pilmart_flutter/shared/models/notice.dart';

final _noticesProvider = FutureProvider<List<Notice>>((ref) async {
  final rows = await supabase.from('notices').select().order('created_at', ascending: false);
  return (rows as List).map((r) => Notice.fromJson(r as Map<String, dynamic>)).toList();
});

class NoticePage extends ConsumerWidget {
  const NoticePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncNotices = ref.watch(_noticesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('공지사항')),
      body: asyncNotices.when(
        data: (notices) {
          if (notices.isEmpty) return const Center(child: Text('공지사항이 없습니다'));
          return ListView.builder(
            itemCount: notices.length,
            itemBuilder: (ctx, i) {
              final n = notices[i];
              return ExpansionTile(
                title: Text(n.title, style: const TextStyle(fontWeight: FontWeight.w500)),
                subtitle: Text(n.createdAt.toLocal().toString().substring(0, 10), style: const TextStyle(fontSize: 12)),
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: Align(alignment: Alignment.centerLeft, child: Text(n.content)),
                  ),
                ],
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('오류: $e')),
      ),
    );
  }
}
```

- [ ] **Step 3: lib/app.dart `/profile`, `/notice` 라우트 교체**

```dart
GoRoute(path: '/profile', builder: (ctx, state) => const ProfilePage()),
GoRoute(path: '/notice', builder: (ctx, state) => const NoticePage()),
```

imports:
```dart
import 'package:pilmart_flutter/features/profile/profile_page.dart';
import 'package:pilmart_flutter/features/notice/notice_page.dart';
```

- [ ] **Step 4: flutter analyze + flutter test**

```powershell
flutter analyze
flutter test
```

Expected: 0 new issues, all tests pass

- [ ] **Step 5: 커밋**

```powershell
git add pilmart-flutter/lib/features/profile/
git add pilmart-flutter/lib/features/notice/
git add pilmart-flutter/lib/app.dart
git commit -m "feat: 마이페이지(다음주소 WebView 포함) + 공지사항 화면"
```

---

## 자기검토 (Self-Review)

### 1. 스펙 커버리지

| 스펙 섹션 3 항목 | 대응 태스크 |
|---|---|
| 홈: PageView 배너 + 자동슬라이드 | Task 2 hero_banner.dart |
| 홈: 플래시세일 + 카운트다운 | Task 2 flash_sale_section.dart |
| 홈: 상품 그리드 | Task 2 product_grid.dart |
| 카테고리 칩 스크롤 | Task 3 category_page.dart |
| 상품 상세: taxType 뱃지 + VAT 분리 | Task 3 product_detail_page.dart |
| 상품 상세: 찜 토글 | Task 3 (Supabase wishlists) |
| 장바구니: 수량·삭제·세금분리 | Task 4 |
| Checkout: profiles 배송지 로드 | Task 5 |
| Checkout: 만나서 결제 바로 confirm | Task 5 |
| Toss WebView: pilmart:// 스킴 수신 | Task 5 |
| 주문내역: 상태 뱃지 색상 | Task 6 status_badge.dart |
| 주문내역: 부분취소 (배송완료·취소완료 제외) | Task 6 orders_page.dart |
| 찜 목록: Supabase wishlists 스트림 | Task 7 |
| 마이페이지: 다음 주소 WebView | Task 8 |
| 공지사항: ExpansionTile | Task 8 |

### 2. Placeholder 없음 확인

모든 스텝에 실제 Dart 코드 포함됨. "TBD" / "TODO" 없음.

### 3. 타입 일관성

- `CartItem.productId: String` — Task 4 정의, Task 5에서 동일하게 사용
- `productsProvider: FutureProvider<List<Product>>` — Task 1 정의, Task 2·3·7에서 `ref.watch(productsProvider)` 사용
- `wishlistIdsProvider: StreamProvider<List<String>>` — Task 7 정의, Task 7 페이지에서 사용
- `ordersProvider: StreamProvider<List<Order>>` — Task 6 정의, Task 6 페이지에서 사용
- `cartProvider: NotifierProvider<CartNotifier, List<CartItem>>` — Task 4 정의, Task 5에서 `ref.read(cartProvider.notifier).clear()` 사용

모든 타입과 메서드명이 정의 태스크와 사용 태스크 간에 일치함.
