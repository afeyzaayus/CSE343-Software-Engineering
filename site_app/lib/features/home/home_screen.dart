import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/dio_provider.dart';
import '../../core/repos/announcements_repo.dart';
import '../../core/models/announcement.dart';

/// Repo provider
final announcementsRepoProvider =
    Provider<AnnouncementsRepo>((ref) => AnnouncementsRepo(ref.read(dioProvider)));

/// Aktif kullanıcının siteId’sine göre duyuruları getiren provider
final announcementsFutureProvider =
    FutureProvider<List<Announcement>>((ref) async {
  final user = ref.read(authStateProvider).user!;
  final repo = ref.read(announcementsRepoProvider);
  // /api/sites/{siteId}/announcements
  return repo.listBySite(user.siteId);
});

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).user;
    final asyncAnnouncements = ref.watch(announcementsFutureProvider);

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(user.name, style: const TextStyle(fontWeight: FontWeight.w600)),
            Text(user.siteName, style: Theme.of(context).textTheme.labelSmall),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => context.push('/profile'),
            icon: const Icon(Icons.person),
          ),
        ],
      ),
      body: asyncAnnouncements.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Failed to load announcements.'),
                const SizedBox(height: 8),
                FilledButton(
                  onPressed: () => ref.invalidate(announcementsFutureProvider),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
        data: (items) {
          if (items.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async => ref.invalidate(announcementsFutureProvider),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 160),
                  Center(child: Text('No announcements yet.')),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(announcementsFutureProvider),
            child: ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final a = items[i];
                final hh = a.createdAt.hour.toString().padLeft(2, '0');
                final mm = a.createdAt.minute.toString().padLeft(2, '0');
                return ListTile(
                  title: Text(a.title),
                  subtitle: Text(a.body),
                  trailing: Text('$hh:$mm'),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
