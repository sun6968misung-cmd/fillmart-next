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
import 'features/product/flash_product_page.dart';
import 'features/cart/cart_page.dart';
import 'features/checkout/checkout_page.dart';
import 'features/checkout/toss_webview_page.dart';
import 'features/checkout/success_page.dart';
import 'features/orders/orders_page.dart';
import 'features/wishlist/wishlist_page.dart';
import 'features/profile/profile_page.dart';
import 'features/notice/notice_page.dart';
import 'features/admin/admin_shell.dart';
import 'features/admin/orders/admin_orders_page.dart';
import 'features/admin/products/admin_products_page.dart';
import 'features/admin/flash_sale/admin_flash_sale_page.dart';
import 'features/admin/notices/admin_notices_page.dart';
import 'features/admin/store/admin_store_info_page.dart';
import 'features/admin/members/admin_members_page.dart';
import 'features/admin/accounts/admin_accounts_page.dart';
import 'features/admin/logs/admin_logs_page.dart';
import 'features/admin/members/admin_member_detail_page.dart';
import 'features/admin/members/admin_member_day_page.dart';
import 'features/orders/lookup_page.dart';
import 'shared/theme/app_theme.dart';

class PilmartApp extends ConsumerWidget {
  const PilmartApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = GoRouter(
      initialLocation: '/home',
      redirect: (context, state) {
        final loc = state.matchedLocation;
        final isAdminArea = loc.startsWith('/admin') && loc != '/admin/login';

        // 웹 버전과 동일하게 홈/카테고리/상품/장바구니/결제는 비회원도 이용 가능.
        // 회원 전용(찜/마이페이지/주문내역)만 로그인 필요. '/orders/lookup'(비회원 조회)은 제외.
        final requiresLogin = loc == '/wishlist' ||
            loc == '/profile' ||
            loc == '/orders';

        final adminSession = ref.read(adminSessionProvider);
        final customerUser = ref.read(customerAuthProvider).valueOrNull;

        if (isAdminArea && adminSession == null) return '/admin/login';
        if (requiresLogin && customerUser == null) return '/auth';
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
              builder: (_, __) => const CategoryPage(slug: '야채/채소'),
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
              builder: (_, s) => FlashProductPage(
                idx: int.tryParse(s.pathParameters['idx'] ?? '0') ?? 0,
              ),
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
              builder: (_, __) => const LookupPage(),
            ),
            GoRoute(
              path: '/wishlist',
              builder: (_, __) => const WishlistPage(),
            ),
            GoRoute(
              path: '/profile',
              builder: (_, __) => const ProfilePage(),
            ),
            GoRoute(
              path: '/notice',
              builder: (_, __) => const NoticePage(),
            ),
          ],
        ),

        // 관리자 쉘
        ShellRoute(
          builder: (_, __, child) => AdminShell(child: child),
          routes: [
            GoRoute(
              path: '/admin/orders',
              builder: (_, __) => const AdminOrdersPage(),
            ),
            GoRoute(
              path: '/admin/products',
              builder: (_, __) => const AdminProductsPage(),
            ),
            GoRoute(
              path: '/admin/flash-sale',
              builder: (_, __) => const AdminFlashSalePage(),
            ),
            GoRoute(
              path: '/admin/notices',
              builder: (_, __) => const AdminNoticesPage(),
            ),
            GoRoute(
              path: '/admin/store-info',
              builder: (_, __) => const AdminStoreInfoPage(),
            ),
            GoRoute(
              path: '/admin/members',
              builder: (_, __) => const AdminMembersPage(),
            ),
            GoRoute(
              path: '/admin/member/:phone',
              builder: (_, s) =>
                  AdminMemberDetailPage(phone: s.pathParameters['phone']!),
            ),
            GoRoute(
              path: '/admin/member/:phone/day/:date',
              builder: (_, s) => AdminMemberDayPage(
                phone: s.pathParameters['phone']!,
                date: s.pathParameters['date']!,
              ),
            ),
            GoRoute(
              path: '/admin/accounts',
              builder: (_, __) => const AdminAccountsPage(),
            ),
            GoRoute(
              path: '/admin/logs',
              builder: (_, __) => const AdminLogsPage(),
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
