import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/dio_provider.dart';
import '../../core/repos/requests_repo.dart';
import '../../core/models/request_ticket.dart';
import '../widgets/status_chip.dart';

/// Repo provider
final requestsRepoProvider =
    Provider<RequestsRepo>((ref) => RequestsRepo(ref.read(dioProvider)));

/// Listeyi getiren FutureProvider (kullanıcının kendi talepleri)
final requestsFutureProvider =
    FutureProvider<List<RequestTicket>>((ref) async {
  final user = ref.read(authStateProvider).user!;
  final repo = ref.read(requestsRepoProvider);
  return repo.listMine(user.id); // /api/users/{userId}/requests
});

class RequestsScreen extends ConsumerWidget {
  const RequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncTickets = ref.watch(requestsFutureProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Requests')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          // Yeni talep ekranını push’la aç (shell’de stack korunsun)
          await context.push('/requests/new');
          // Dönüşte listeyi tazele
          ref.invalidate(requestsFutureProvider);
        },
        icon: const Icon(Icons.add),
        label: const Text('New Request'),
      ),
      body: asyncTickets.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Failed to load requests.'),
                const SizedBox(height: 8),
                FilledButton(
                  onPressed: () => ref.invalidate(requestsFutureProvider),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
        data: (items) {
          if (items.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async => ref.invalidate(requestsFutureProvider),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 160),
                  Center(child: Text('No requests yet.')),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(requestsFutureProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final t = items[i];
                return ListTile(
                  title: Text(t.title),
                  subtitle: Text(t.description),
                  trailing: StatusChip(status: t.status),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
