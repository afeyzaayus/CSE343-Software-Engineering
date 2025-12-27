import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart'; // Used for date formatting

import '../../core/auth/auth_controller.dart';
import '../../core/network/dio_provider.dart';
import '../../core/repos/announcements_repo.dart';
import '../../core/models/announcement.dart';

/// Provider for the Announcements Repository.
final announcementsRepoProvider = Provider<AnnouncementsRepo>(
  (ref) => AnnouncementsRepo(ref.read(dioProvider)),
);

/// Asynchronously fetches the list of announcements for the logged-in user's site.
/// Uses [autoDispose] to reset state when the user leaves the screen.
final announcementsFutureProvider =
    FutureProvider.autoDispose<List<Announcement>>((ref) async {
  final user = ref.read(authStateProvider).user;
  
  // If no user is logged in, return an empty list immediately.
  if (user == null) return [];
  
  final repo = ref.read(announcementsRepoProvider);
  return repo.listBySite(user.siteCode.toString());
});

/// The main dashboard screen displaying user info and announcements.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).user;
    final asyncAnnouncements = ref.watch(announcementsFutureProvider);

    // Define local theme colors
    const primaryColor = Color(0xFF1A4F70);
    const backgroundColor = Color(0xFFF5F7FA);

    // Show a loader while the user session is being restored
    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    // Generate initials for the avatar (e.g., "Ahmet Yilmaz" -> "AY")
    String initials = '';
    if (user.name.isNotEmpty) {
      final names = user.name.trim().split(' ');
      initials = names.length >= 2
          ? '${names.first[0]}${names.last[0]}'.toUpperCase()
          : names.first[0].toUpperCase();
    }

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: primaryColor,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
          child: GestureDetector(
            onTap: () => context.push('/profile'),
            child: CircleAvatar(
              backgroundColor: Colors.white,
              child: Text(
                initials,
                style: const TextStyle(
                  color: primaryColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Ana Sayfa',
              style: TextStyle(fontSize: 14, color: Colors.white70),
            ),
            Text(
              user.siteName,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
      body: asyncAnnouncements.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        
        // Error State
        error: (e, st) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 48),
              const SizedBox(height: 16),
              const Text('Duyurular yüklenemedi.'),
              TextButton(
                onPressed: () => ref.invalidate(announcementsFutureProvider),
                child: const Text('Tekrar Dene'),
              ),
            ],
          ),
        ),
        
        // Data Loaded State
        data: (items) {
          if (items.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async => ref.invalidate(announcementsFutureProvider),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  Center(
                    child: Column(
                      children: [
                        Icon(
                          Icons.campaign_outlined,
                          size: 64,
                          color: Colors.grey[300],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Henüz duyuru yok.',
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
            onRefresh: () async => ref.invalidate(announcementsFutureProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (_, i) {
                final announcement = items[i];
                
                // Add a header before the first item
                if (i == 0) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.only(bottom: 12.0, left: 4),
                        child: Text(
                          "Son Duyurular",
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: primaryColor,
                          ),
                        ),
                      ),
                      _buildAnnouncementCard(context, announcement),
                    ],
                  );
                }
                return _buildAnnouncementCard(context, announcement);
              },
            ),
          );
        },
      ),
    );
  }

  /// Builds a single card widget for an announcement.
  Widget _buildAnnouncementCard(BuildContext context, Announcement a) {
    // Format date: "27.12 14:30"
    final dateStr = DateFormat('dd.MM HH:mm').format(a.createdAt);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: () => _showDetailBottomSheet(context, a, dateStr),
          child: IntrinsicHeight(
            child: Row(
              children: [
                // Decorative colored bar on the left
                Container(
                  width: 6,
                  decoration: const BoxDecoration(
                    color: Color(0xFF1A4F70),
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(8),
                      bottomLeft: Radius.circular(8),
                    ),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                a.title,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: Color(0xFF1A4F70),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Text(
                              dateStr,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[500],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          a.body,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.grey[700],
                            fontSize: 14,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Displays the full details of the announcement in a bottom sheet.
  void _showDetailBottomSheet(
    BuildContext context,
    Announcement a,
    String dateStr,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.4,
          maxChildSize: 0.95,
          builder: (_, scrollController) {
            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: ListView(
                controller: scrollController,
                children: [
                  const SizedBox(height: 12),
                  // Drag Handle
                  Center(
                    child: Container(
                      width: 50,
                      height: 5,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  Text(
                    a.title,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1A4F70),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Date Row
                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_today,
                        size: 14,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        dateStr,
                        style: TextStyle(color: Colors.grey[600], fontSize: 14),
                      ),
                    ],
                  ),

                  const Divider(height: 32, thickness: 1),

                  // Full Content
                  Text(
                    a.body,
                    style: const TextStyle(
                      fontSize: 16,
                      height: 1.6,
                      color: Colors.black87,
                    ),
                  ),
                  SizedBox(height: MediaQuery.of(context).padding.bottom + 20),
                ],
              ),
            );
          },
        );
      },
    );
  }
}