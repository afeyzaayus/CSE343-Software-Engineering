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
  // API rotası düzeltildi: /api/social-facilities/site/:id
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
          'Social Facilities',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF1A4F70), // Kurumsal Mavi
        foregroundColor: Colors.white,
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

// --- TASARIM DETAYI: FACILITY CARD (GÜNCELLENMİŞ) ---
class _SocialFacilityCard extends StatelessWidget {
  final SocialAmenity facility;

  const _SocialFacilityCard({required this.facility});

  @override
  Widget build(BuildContext context) {
    // Statü Rengi Belirleme
    final statusLower = facility.status.toLowerCase();
    final isOpen = statusLower.contains('açık') ||
        statusLower.contains('open') ||
        statusLower.contains('active');

    final statusColor = isOpen ? Colors.green : Colors.red;
    final statusText = isOpen ? 'AÇIK' : 'KAPALI';

    return Card(
      elevation: 2,
      shadowColor: Colors.black.withOpacity(0.9),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _showFacilityDetails(context, isOpen, statusColor),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. ÜST KISIM: İkon, Başlık ve Statü
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _getIconForName(facility.name),
                      color: const Color(0xFF1A4F70),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          facility.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: Colors.black87,
                          ),
                        ),
                        if (facility.description.isNotEmpty)
                          Text(
                            facility.description,
                            maxLines: 1, // Sadece 1 satır göster
                            overflow: TextOverflow.ellipsis, // Sığmazsa ... koy
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 13,
                            ),
                          ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: statusColor.withOpacity(0.5)),
                    ),
                    child: Text(
                      statusText,
                      style: TextStyle(
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
              
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Divider(height: 1),
              ),

              // 2. ALT KISIM: Kısa Bilgiler
              _buildInfoRow(Icons.access_time, "Hours:", facility.hours.isNotEmpty ? facility.hours : 'Belirtilmedi'),
              const SizedBox(height: 8),
              _buildInfoRow(
                Icons.info_outline,
                "Info:",
                "Tap for details", // Kullanıcıyı tıklamaya teşvik eden yazı
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- DETAY PENCERESİ (MODAL) ---
  void _showFacilityDetails(BuildContext context, bool isOpen, Color statusColor) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        builder: (_, controller) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
          child: ListView(
            controller: controller,
            children: [
              // Tutamaç Çizgisi
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              
              // Başlık
              Text(
                facility.name,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A4F70),
                ),
              ),
              const SizedBox(height: 16),

              // Durum Etiketi (Büyük)
              Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: statusColor.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(isOpen ? Icons.check_circle : Icons.cancel, size: 16, color: statusColor),
                      const SizedBox(width: 8),
                      Text(
                        isOpen ? 'Currently Open' : 'Currently Closed',
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Detaylar
              _buildDetailSection("Description", facility.description),
              _buildDetailSection("Opening Hours", facility.hours),
              _buildDetailSection("Rules & Regulations", facility.rules),
              // Eğer modelinde 'extra' alanı varsa buraya ekleyebilirsin:
              // _buildDetailSection("Extra Info", facility.extra),

              const SizedBox(height: 24),
              
              // Kapat Butonu
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1A4F70),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text("Close"),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Detay Başlıkları ve İçerikleri
  Widget _buildDetailSection(String title, String? content) {
    if (content == null || content.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.grey[500],
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: const TextStyle(
              fontSize: 16,
              height: 1.5,
              color: Colors.black87,
            ),
          ),
          const Divider(height: 30),
        ],
      ),
    );
  }

  // Kart üzerindeki satır yapısı
  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey[500]),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.black87,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }

  // İkon Seçici
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
    } else if (n.contains('kütüphane') || n.contains('library') || n.contains('kitap')) {
      return Icons.local_library;
    }
    return Icons.meeting_room;
  }
}