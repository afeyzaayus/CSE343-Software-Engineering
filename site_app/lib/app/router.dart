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
import '../features/auth/forgot_password_screen.dart';

/// Provides the global GoRouter configuration with redirection logic based on authentication state.
final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/login',
    
    // Redirect logic to handle protected and public routes
    redirect: (context, state) {
      final isLoggedIn = authState.isLoggedIn;
      final path = state.matchedLocation;
      
      // Define pages that can be accessed without logging in
      final isPublicPage = path == '/login' ||
          path.startsWith('/signup') ||
          path.startsWith('/link') || 
          path == '/forgot-password';

      if (!isLoggedIn) {
        // If not logged in and trying to access a public page, allow it.
        if (isPublicPage) {
          return null; 
        }
        // Otherwise, force redirect to login.
        return '/login';
      }

      // If logged in and trying to access login/signup, redirect to home.
      if (path == '/login' || path.startsWith('/signup')) {
        return '/home';
      }

      return null; // No redirection needed
    },

    routes: [
      GoRoute(path: '/login', builder: (ctx, st) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (ctx, st) => const SignupScreen()),
      GoRoute(
        path: '/forgot-password',
        builder: (ctx, st) => const ForgotPasswordScreen(),
      ),

      // Bottom Navigation Shell
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            TabsShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/home', builder: (ctx, st) => const HomeScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/payments',
                builder: (ctx, st) => const PaymentsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
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
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/social',
                builder: (ctx, st) => const SocialScreen(),
              ),
            ],
          ),
        ],
      ),

      // Standalone routes (outside of bottom navigation)
      GoRoute(path: '/profile', builder: (ctx, st) => const ProfileScreen()),
    ],
  );
});

/// A wrapper widget that implements the Bottom Navigation Bar using StatefulShellRoute.
class TabsShell extends StatelessWidget {
  const TabsShell({super.key, required this.navigationShell});
  
  final StatefulNavigationShell navigationShell;

  void _onTap(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    const labels = ['Home', 'Payments', 'Requests', 'Social'];
    const icons = [
      Icons.home_outlined,
      Icons.payment,
      Icons.assignment,
      Icons.groups,
    ];

    return Scaffold(
      body: navigationShell,
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