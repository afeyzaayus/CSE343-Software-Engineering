import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_controller.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).user!;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile Details')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(user.name, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(user.email),
          const SizedBox(height: 8),
          Text(user.siteName),
          const Spacer(),
          Align(
            alignment: Alignment.bottomRight,
            child: OutlinedButton.icon(
              onPressed: () => ref.read(authStateProvider.notifier).logout(),
              icon: const Icon(Icons.logout), label: const Text('Log Out'),
            ),
          )
        ]),
      ),
    );
  }
}
