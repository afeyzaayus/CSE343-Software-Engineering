import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/network/dio_provider.dart';
import '../../core/repos/requests_repo.dart';
import '../../core/models/request_ticket.dart';

/// Provider for the Requests Repository.
final requestsRepoProvider = Provider<RequestsRepo>(
  (ref) => RequestsRepo(ref.read(dioProvider)),
);

/// Fetches the current user's request tickets.
/// Uses [autoDispose] to refresh data when the user re-enters the screen.
final requestsFutureProvider = FutureProvider.autoDispose<List<RequestTicket>>((
  ref,
) async {
  final user = ref.read(authStateProvider).user;
  if (user == null) return [];

  final repo = ref.read(requestsRepoProvider);
  return repo.listMine(userId: user.id.toString(), siteId: user.siteCode);
});

class RequestsScreen extends ConsumerWidget {
  const RequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncTickets = ref.watch(requestsFutureProvider);
    const primaryColor = Color(0xFF1A4F70);

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('Taleplerim'),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        centerTitle: true,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          // Navigate to new request screen and refresh list upon return
          await context.push('/requests/new');
          ref.invalidate(requestsFutureProvider);
        },
        icon: const Icon(Icons.add),
        label: const Text('Yeni Talep'),
        backgroundColor: primaryColor,
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
              const Text('Talepler yüklenirken hata oluştu.'),
              TextButton(
                onPressed: () => ref.invalidate(requestsFutureProvider),
                child: const Text('Tekrar Dene'),
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
                        Text(
                          'Henüz bir talep bulunmuyor.',
                          style: TextStyle(color: Colors.grey[600]),
                        ),
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

  /// Helper to map backend category keys to UI strings.
  String _getCategoryName(String key) {
    const map = {
      'MAINTENANCE': 'Bakım / Onarım',
      'COMPLAINT': 'Şikayet',
      'REQUEST': 'İstek / Talep',
      'OTHER': 'Diğer',
    };
    return map[key] ?? key;
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd MMM yyyy', 'tr_TR');

    Color statusColor;
    IconData statusIcon;
    String statusTextTr;

    // Determine visual style based on ticket status
    switch (ticket.status) {
      case TicketStatus.pending:
        statusColor = Colors.orange;
        statusIcon = Icons.hourglass_empty;
        statusTextTr = 'BEKLEMEDE';
        break;
      case TicketStatus.inProgress:
        statusColor = Colors.blue;
        statusIcon = Icons.engineering;
        statusTextTr = 'İŞLEMDE';
        break;
      case TicketStatus.resolved:
        statusColor = Colors.green;
        statusIcon = Icons.check_circle_outline;
        statusTextTr = 'ÇÖZÜLDÜ';
        break;
      case TicketStatus.cancelled:
        statusColor = Colors.grey;
        statusIcon = Icons.cancel_outlined;
        statusTextTr = 'İPTAL EDİLDİ';
        break;
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            // Updated for Flutter 3.27+
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: Category Tag & Date
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    _getCategoryName(ticket.category),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[700],
                    ),
                  ),
                ),
                Text(
                  dateFormat.format(ticket.createdAt),
                  style: TextStyle(color: Colors.grey[500], fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Title
            Text(
              ticket.title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 4),

            // Content Preview
            Text(
              ticket.content,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
            const SizedBox(height: 12),

            // Status Indicator
            Row(
              children: [
                Icon(statusIcon, size: 16, color: statusColor),
                const SizedBox(width: 4),
                Text(
                  statusTextTr,
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
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