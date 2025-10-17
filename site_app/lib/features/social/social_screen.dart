import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/network/dio_provider.dart';
import '../../core/repos/social_repo.dart';

final socialRepoProvider = Provider<SocialRepo>(
  (ref) => SocialRepo(ref.read(dioProvider)),
);

final socialFutureProvider = FutureProvider<List<SocialAmenity>>((ref) async {
  final user = ref.watch(authStateProvider).user!;
  return ref.read(socialRepoProvider).listBySite(user.siteId);
});

class SocialScreen extends ConsumerWidget {
  const SocialScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncSocial = ref.watch(socialFutureProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Social Facilities'),
      ),
      body: asyncSocial.when(
        data: (facilities) {
          if (facilities.isEmpty) {
            return const Center(
              child: Text('No social amenities found for your site.'),
            );
          }
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(socialFutureProvider);
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: facilities.length,
              separatorBuilder: (_, __) => const Divider(),
              itemBuilder: (_, i) {
                final f = facilities[i];
                return ListTile(
                  leading: const Icon(Icons.place),
                  title: Text(f.name),
                  subtitle: Text(f.rules),
                  onTap: () {
                    // İstersen detay sayfası açabilirsin
                    // context.push('/social/${f.id}');
                  },
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Failed to load social amenities.'),
              const SizedBox(height: 8),
              FilledButton(
                onPressed: () => ref.invalidate(socialFutureProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
