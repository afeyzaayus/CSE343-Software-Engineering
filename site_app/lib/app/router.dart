import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/auth/auth_controller.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/signup_screen.dart';
import '../features/home/home_screen.dart';
import '../features/payments/payments_screen.dart';
import '../features/requests/requests_screen.dart';
import '../features/requests/new_request_screen.dart';
import '../features/social/social_screen.dart';
import '../features/profile/profile_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (ctx, state) {
      final loggedIn = auth.isLoggedIn;
      final loggingIn =
          state.matchedLocation == '/login' || state.matchedLocation == '/signup';
      if (!loggedIn && !loggingIn) return '/login';
      if (loggedIn && loggingIn) return '/home';
      return null;
    },
    routes: [
      // Public routes
      GoRoute(path: '/login', builder: (ctx, st) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (ctx, st) => const SignupScreen()),

      // Private area with a persistent bottom bar
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            TabsShell(navigationShell: navigationShell),
        branches: [
          // Home
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/home',
              builder: (ctx, st) => const HomeScreen(),
            ),
          ]),
          // Payments
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/payments',
              builder: (ctx, st) => const PaymentsScreen(),
            ),
          ]),
          // Requests (list + new)
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/requests',
              builder: (ctx, st) => const RequestsScreen(),
              routes: [
                GoRoute(
                  path: 'new',
                  builder: (ctx, st) => const NewRequestScreen(),
                ),
              ],
            ),
          ]),
          // Social
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/social',
              builder: (ctx, st) => const SocialScreen(),
            ),
          ]),
        ],
      ),

      // Other standalone (push) pages
      GoRoute(path: '/profile', builder: (ctx, st) => const ProfileScreen()),
    ],
  );
});

class TabsShell extends StatelessWidget {
  const TabsShell({super.key, required this.navigationShell});
  final StatefulNavigationShell navigationShell;

  void _onTap(int index) {
    // Aynı index’e tıklanırsa o branch’in root’una döner
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    final labels = const ['Home', 'Payments', 'Requests', 'Social'];
    final icons = const [
      Icons.home_outlined,
      Icons.payment,
      Icons.assignment,
      Icons.groups
    ];

    return Scaffold(
      body: navigationShell, // aktif sekmenin içeriği burada
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: _onTap,
        destinations: List.generate(
          4,
          (i) => NavigationDestination(icon: Icon(icons[i]), label: labels[i]),
        ),
      ),
    );
  }
}
