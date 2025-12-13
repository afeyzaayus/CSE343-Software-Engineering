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
    FutureProvider.autoDispose<List<Announcement>>((ref) async {
  final user = ref.read(authStateProvider).user;
  if (user == null) return [];
  final repo = ref.read(announcementsRepoProvider);
  return repo.listBySite(user.siteCode.toString());
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
            Text(user.siteName, style: const TextStyle(fontWeight: FontWeight.w600)),
            // Text(user.siteName, ...), // User modelinizde varsa ekleyin
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => ref.read(authStateProvider.notifier).logout(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: asyncAnnouncements.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 48),
              const SizedBox(height: 16),
              const Text('Duyurular yüklenemedi.'),
              FilledButton(
                onPressed: () => ref.invalidate(announcementsFutureProvider),
                child: const Text('Tekrar Dene'),
              ),
            ],
          ),
        ),
        data: (items) {
          if (items.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async => ref.invalidate(announcementsFutureProvider),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  const Center(child: Text('Henüz duyuru yok.')),
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
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) {
                final a = items[i];
                
                // Tarih formatlama
                final hh = a.createdAt.hour.toString().padLeft(2, '0');
                final mm = a.createdAt.minute.toString().padLeft(2, '0');
                final dd = a.createdAt.day.toString().padLeft(2, '0');
                final mon = a.createdAt.month.toString().padLeft(2, '0');
                final dateStr = '$dd.$mon $hh:$mm';

                return Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  clipBehavior: Clip.antiAlias,
                  child: InkWell(
                    // DEĞİŞİKLİK: Artık BottomSheet açıyor
                    onTap: () => _showDetailBottomSheet(context, a, dateStr),
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(16),
                      title: Text(
                        a.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 8.0),
                        child: Text(
                          a.body,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.expand_more, size: 20, color: Colors.grey),
                          const SizedBox(height: 4),
                          Text(
                            '$dd.$mon', 
                            style: const TextStyle(fontSize: 12, color: Colors.grey)
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  // --- ALTTAN ÇIKAN PANEL (BOTTOM SHEET) ---
  void _showDetailBottomSheet(BuildContext context, Announcement a, String dateStr) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true, // Panelin tam boyuta kadar uzamasını sağlar
      backgroundColor: Colors.transparent, // Köşelerin yuvarlak olması için
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.5, // Ekranın yarısı kadar açılsın
          minChildSize: 0.3,     // En az bu kadar küçülsün
          maxChildSize: 0.9,     // En fazla %90'a kadar büyüsün
          builder: (_, scrollController) {
            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: ListView( // SingleChildScrollView yerine ListView kullandık (controller için)
                controller: scrollController,
                children: [
                  const SizedBox(height: 12),
                  // Tutma Çubuğu (Gri Çizgi)
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

                  // Başlık
                  Text(
                    a.title,
                    style: const TextStyle(
                      fontSize: 22, 
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Tarih Bilgisi
                  Row(
                    children: [
                      const Icon(Icons.access_time, size: 16, color: Colors.grey),
                      const SizedBox(width: 6),
                      Text(
                        dateStr,
                        style: TextStyle(color: Colors.grey[600], fontSize: 14),
                      ),
                    ],
                  ),

                  const Divider(height: 32, thickness: 1),

                  // İçerik Metni
                  Text(
                    a.body,
                    style: const TextStyle(
                      fontSize: 16, 
                      height: 1.6, // Satır aralığı okunabilirlik için
                      color: Colors.black87
                    ),
                  ),
                  
                  // Alt boşluk (Güvenli alan)
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