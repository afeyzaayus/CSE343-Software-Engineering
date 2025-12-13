import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/network/dio_provider.dart';
import '../../core/repos/social_repo.dart';
import '../../core/models/social_amenity.dart';

// --- PROVIDER TANIMLARI ---
final socialRepoProvider = Provider<SocialRepo>(
  (ref) => SocialRepo(ref.read(dioProvider)),
);

final socialFutureProvider = FutureProvider.autoDispose<List<SocialAmenity>>((ref) async {
  final user = ref.read(authStateProvider).user;
  if (user == null) return [];
  return ref.read(socialRepoProvider).listBySite(user.siteId);
});

class SocialScreen extends ConsumerWidget {
  const SocialScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncSocial = ref.watch(socialFutureProvider);

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text(
          'Social Facilities', // UI Başlığı İngilizce
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        elevation: 0,
      ),
      body: asyncSocial.when(
        data: (facilities) {
          if (facilities.isEmpty) {
            return _buildEmptyState(ref);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(socialFutureProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: facilities.length,
              separatorBuilder: (_, __) => const SizedBox(height: 16),
              itemBuilder: (_, i) {
                return _SocialFacilityCard(facility: facilities[i]);
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.wifi_off, size: 48, color: Colors.grey),
              const SizedBox(height: 16),
              const Text('Failed to load facilities.'),
              TextButton(
                onPressed: () => ref.invalidate(socialFutureProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(WidgetRef ref) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.deck, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No social facilities found for your site.',
            style: TextStyle(color: Colors.grey[600], fontSize: 16),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => ref.invalidate(socialFutureProvider),
            child: const Text('Refresh'),
          ),
        ],
      ),
    );
  }
}

// --- TASARIM DETAYI: FACILITY CARD ---
class _SocialFacilityCard extends StatelessWidget {
  final SocialAmenity facility;

  const _SocialFacilityCard({required this.facility});

  @override
  Widget build(BuildContext context) {
    // Sadece RENK ayarı için kontrol yapıyoruz (Görsellik bozulmasın diye).
    // Eğer içinde 'açık' veya 'open' geçiyorsa yeşil, yoksa kırmızı/turuncu yap.
    final statusLower = facility.status.toLowerCase();
    final isPositive = statusLower.contains('açık') || statusLower.contains('open') || statusLower.contains('active');
    
    final statusColor = isPositive ? Colors.green : Colors.red;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Üst Kısım: Resim/İkon ve Statü
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              children: [
                // İkon Kutusu
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _getIconForName(facility.name),
                    color: Colors.blue[700],
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                // İsim ve Açıklama
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        facility.name, // DB'den gelen veri direkt
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      if (facility.description.isNotEmpty)
                        Text(
                          facility.description, // DB'den gelen veri direkt
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                ),
                // Statü Chip
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor.withOpacity(0.5)),
                  ),
                  child: Text(
                    facility.status.toUpperCase(), // DB'den geleni BÜYÜK HARFLE yaz
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 2. Alt Kısım: Saatler ve Kurallar
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Saat Bilgisi
                if (facility.hours.isNotEmpty)
                  Row(
                    children: [
                      const Icon(Icons.access_time, size: 18, color: Colors.grey),
                      const SizedBox(width: 8),
                      const Text(
                        'Opening Hours: ', // UI Label İngilizce
                        style: TextStyle(color: Colors.grey),
                      ),
                      Text(
                        facility.hours, // DB'den gelen saat verisi
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  ),
                
                if (facility.rules.isNotEmpty) ...[
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Divider(),
                  ),
                  // Kural Bilgisi
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.info_outline, size: 18, color: Colors.orange),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          facility.rules, // DB'den gelen kural metni
                          style: TextStyle(
                            color: Colors.grey[700],
                            fontSize: 13,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  // İkon seçimi (Türkçe isimlere duyarlı kalmalı çünkü DB Türkçe gönderiyor)
  IconData _getIconForName(String name) {
    final n = name.toLowerCase();
    if (n.contains('spor') || n.contains('fitness') || n.contains('gym') || n.contains('sport')) {
      return Icons.fitness_center;
    } else if (n.contains('havuz') || n.contains('pool') || n.contains('swim')) {
      return Icons.pool;
    } else if (n.contains('park') || n.contains('bahçe') || n.contains('garden')) {
      return Icons.park;
    } else if (n.contains('kafe') || n.contains('cafe')) {
      return Icons.local_cafe;
    } else if (n.contains('sauna') || n.contains('spa')) {
      return Icons.hot_tub;
    }
    return Icons.meeting_room;
  }
}