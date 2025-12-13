import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/dio_provider.dart';
import '../../core/repos/requests_repo.dart';
import '../../core/models/request_ticket.dart';

/// Repo Provider
final requestsRepoProvider = Provider<RequestsRepo>((ref) => RequestsRepo(ref.read(dioProvider)));

/// Future Provider
final requestsFutureProvider = FutureProvider.autoDispose<List<RequestTicket>>((ref) async {
  final user = ref.read(authStateProvider).user;
  if (user == null) return [];
  
  final repo = ref.read(requestsRepoProvider);
  // Backend'e hem userId hem siteId gönderiyoruz
  return repo.listMine(
    userId: user.id.toString(),
    siteId: user.siteCode,
  );
});

class RequestsScreen extends ConsumerWidget {
  const RequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncTickets = ref.watch(requestsFutureProvider);

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('My Requests & Complaints'),
        centerTitle: true,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await context.push('/requests/new');
          ref.invalidate(requestsFutureProvider);
        },
        icon: const Icon(Icons.add),
        label: const Text('New Request'),
        backgroundColor: Colors.blue[700],
        foregroundColor: Colors.white,
      ),
      body: asyncTickets.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              const Text('Failed to load requests.'),
              TextButton(
                onPressed: () => ref.invalidate(requestsFutureProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (items) {
          if (items.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async => ref.invalidate(requestsFutureProvider),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  Center(
                    child: Column(
                      children: [
                        Icon(Icons.inbox, size: 64, color: Colors.grey[300]),
                        const SizedBox(height: 16),
                        Text('No requests yet.', style: TextStyle(color: Colors.grey[600])),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(requestsFutureProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) {
                return _RequestCard(ticket: items[i]);
              },
            ),
          );
        },
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  final RequestTicket ticket;
  const _RequestCard({required this.ticket});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd MMM yyyy', 'en_US');
    
    // Status Renkleri
    Color statusColor;
    IconData statusIcon;
    switch (ticket.status) {
      case TicketStatus.pending:
        statusColor = Colors.orange;
        statusIcon = Icons.hourglass_empty;
        break;
      case TicketStatus.inProgress:
        statusColor = Colors.blue;
        statusIcon = Icons.engineering;
        break;
      case TicketStatus.resolved:
        statusColor = Colors.green;
        statusIcon = Icons.check_circle_outline;
        break;
      case TicketStatus.cancelled:
        statusColor = Colors.grey;
        statusIcon = Icons.cancel_outlined;
        break;
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Üst Satır: Kategori ve Tarih
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    ticket.category,
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey[700]),
                  ),
                ),
                Text(
                  dateFormat.format(ticket.createdAt),
                  style: TextStyle(color: Colors.grey[500], fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 8),
            
            // Başlık
            Text(
              ticket.title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 4),
            
            // İçerik
            Text(
              ticket.content,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
            const SizedBox(height: 12),
            
            // Alt Satır: Statü
            Row(
              children: [
                Icon(statusIcon, size: 16, color: statusColor),
                const SizedBox(width: 4),
                Text(
                  ticket.statusText.toUpperCase(),
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 12
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}