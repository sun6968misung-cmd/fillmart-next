import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth/admin_auth_provider.dart';

class AdminShell extends ConsumerWidget {
  final Widget child;
  const AdminShell({super.key, required this.child});

  static const _allTabs = [
    (label: '주문 관리', path: '/admin/orders', roles: ['super', 'product', 'order']),
    (label: '상품 관리', path: '/admin/products', roles: ['super', 'product']),
    (label: '특가 관리', path: '/admin/flash-sale', roles: ['super', 'product']),
    (label: '공지 관리', path: '/admin/notices', roles: ['super']),
    (label: '매장 정보', path: '/admin/store-info', roles: ['super']),
    (label: '회원 관리', path: '/admin/members', roles: ['super']),
    (label: '계정 관리', path: '/admin/accounts', roles: ['super']),
    (label: '감사 로그', path: '/admin/logs', roles: ['super']),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(adminSessionProvider);
    final role = session?.role ?? 'order';
    final tabs = _allTabs.where((t) => t.roles.contains(role)).toList();

    final currentLoc = GoRouterState.of(context).matchedLocation;
    final selectedIndex = tabs.indexWhere((t) => currentLoc.startsWith(t.path));

    return Scaffold(
      body: Row(
        children: [
          NavigationDrawer(
            selectedIndex: selectedIndex < 0 ? null : selectedIndex,
            onDestinationSelected: (i) => context.go(tabs[i].path),
            children: [
              DrawerHeader(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '필마트 관리자',
                      style: TextStyle(color: Colors.white, fontSize: 18),
                    ),
                    Text(
                      session?.username ?? '',
                      style: const TextStyle(color: Colors.white70),
                    ),
                    Text(
                      role,
                      style: const TextStyle(color: Colors.white54, fontSize: 12),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () {
                        ref.read(adminSessionProvider.notifier).state = null;
                        context.go('/admin/login');
                      },
                      child: const Text(
                        '로그아웃',
                        style: TextStyle(color: Colors.white70),
                      ),
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
