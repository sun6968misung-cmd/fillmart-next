import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'features/auth/customer_auth_provider.dart';
import 'features/auth/admin_auth_provider.dart';
import 'features/auth/auth_page.dart';
import 'features/auth/admin_login_page.dart';
import 'features/home/customer_shell.dart';
import 'features/home/home_page.dart';
import 'features/product/category_page.dart';
import 'features/product/product_detail_page.dart';
import 'features/cart/cart_page.dart';
import 'features/checkout/checkout_page.dart';
import 'features/checkout/toss_webview_page.dart';
import 'features/checkout/success_page.dart';
import 'features/orders/orders_page.dart';
import 'features/wishlist/wishlist_page.dart';
import 'features/admin/admin_shell.dart';
import 'shared/theme/app_theme.dart';

// 플레이스홀더 화면 (Task 5~8에서 실제 구현으로 교체)
class _PlaceholderPage extends StatelessWidget {
  final String title;
  const _PlaceholderPage(this.title);

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(title)),
        body: Center(child: Text(title)),
      );
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
        GoRoute(
          path: '/auth',
          builder: (_, __) => const AuthPage(),
        ),
        GoRoute(
          path: '/admin/login',
          builder: (_, __) => const AdminLoginPage(),
        ),

        // 고객 쉘
        ShellRoute(
          builder: (_, __, child) => CustomerShell(child: child),
          routes: [
            GoRoute(
              path: '/home',
              builder: (_, __) => const HomePage(),
            ),
            GoRoute(
              path: '/category',
              builder: (_, __) =>
                  const CategoryPage(slug: '야채/채소'),
            ),
            GoRoute(
              path: '/category/:slug',
              builder: (_, s) =>
                  CategoryPage(slug: s.pathParameters['slug']!),
            ),
            GoRoute(
              path: '/product/:id',
              builder: (_, s) =>
                  ProductDetailPage(productId: s.pathParameters['id']!),
            ),
            GoRoute(
              path: '/flash-product/:idx',
              builder: (_, s) =>
                  _PlaceholderPage('특가: ${s.pathParameters['idx']}'),
            ),
            GoRoute(
              path: '/cart',
              builder: (_, __) => const CartPage(),
            ),
            GoRoute(
              path: '/checkout',
              builder: (_, __) => const CheckoutPage(),
            ),
            GoRoute(
              path: '/checkout/payment',
              builder: (_, s) {
                final orderId = s.uri.queryParameters['orderId']!;
                final amount =
                    int.tryParse(s.uri.queryParameters['amount'] ?? '0') ?? 0;
                return TossWebViewPage(orderId: orderId, amount: amount);
              },
            ),
            GoRoute(
              path: '/success',
              builder: (_, s) => SuccessPage(
                paymentKey: s.uri.queryParameters['paymentKey'],
                orderId: s.uri.queryParameters['orderId'] ?? '',
                amount: s.uri.queryParameters['amount'] ?? '0',
                method: s.uri.queryParameters['method'],
              ),
            ),
            GoRoute(
              path: '/orders',
              builder: (_, __) => const OrdersPage(),
            ),
            GoRoute(
              path: '/orders/lookup',
              builder: (_, __) => const _PlaceholderPage('비회원 주문조회'),
            ),
            GoRoute(
              path: '/wishlist',
              builder: (_, __) => const WishlistPage(),
            ),
            GoRoute(
              path: '/profile',
              builder: (_, __) => const _PlaceholderPage('마이페이지'),
            ),
            GoRoute(
              path: '/notice',
              builder: (_, __) => const _PlaceholderPage('공지사항'),
            ),
          ],
        ),

        // 관리자 쉘
        ShellRoute(
          builder: (_, __, child) => AdminShell(child: child),
          routes: [
            GoRoute(
              path: '/admin/orders',
              builder: (_, __) => const _PlaceholderPage('주문 관리'),
            ),
            GoRoute(
              path: '/admin/products',
              builder: (_, __) => const _PlaceholderPage('상품 관리'),
            ),
            GoRoute(
              path: '/admin/flash-sale',
              builder: (_, __) => const _PlaceholderPage('특가 관리'),
            ),
            GoRoute(
              path: '/admin/notices',
              builder: (_, __) => const _PlaceholderPage('공지 관리'),
            ),
            GoRoute(
              path: '/admin/store-info',
              builder: (_, __) => const _PlaceholderPage('매장 정보'),
            ),
            GoRoute(
              path: '/admin/members',
              builder: (_, __) => const _PlaceholderPage('회원 관리'),
            ),
            GoRoute(
              path: '/admin/member/:phone',
              builder: (_, s) =>
                  _PlaceholderPage('회원: ${s.pathParameters['phone']}'),
            ),
            GoRoute(
              path: '/admin/member/:phone/day/:date',
              builder: (_, s) =>
                  _PlaceholderPage('일별 주문: ${s.pathParameters['date']}'),
            ),
            GoRoute(
              path: '/admin/accounts',
              builder: (_, __) => const _PlaceholderPage('계정 관리'),
            ),
            GoRoute(
              path: '/admin/logs',
              builder: (_, __) => const _PlaceholderPage('감사 로그'),
            ),
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
