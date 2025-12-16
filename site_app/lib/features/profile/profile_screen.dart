import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_controller.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).user;

    // Tema Rengi
    const primaryColor = Color(0xFF1A4F70);

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    // Baş harfleri alma (Örn: Ahmet Yılmaz -> AY)
    String initials = '';
    if (user.name.isNotEmpty) {
      final names = user.name.trim().split(' ');
      if (names.length >= 2) {
        initials = '${names.first[0]}${names.last[0]}'.toUpperCase();
      } else {
        initials = names.first[0].toUpperCase();
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA), // Açık gri arka plan
      appBar: AppBar(
        title: const Text('Profilim'),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        centerTitle: true,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // --- ÜST KISIM (HEADER) ---
            Container(
              width: double.infinity,
              padding: const EdgeInsets.only(top: 20, bottom: 40),
              decoration: const BoxDecoration(
                color: primaryColor,
                borderRadius: BorderRadius.vertical(
                  bottom: Radius.circular(30),
                ),
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: Colors.white,
                    child: CircleAvatar(
                      radius: 46,
                      backgroundColor: Colors.blueGrey[50],
                      child: Text(
                        initials,
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: primaryColor,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user.name,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Site Sakini',
                      style: TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // --- KONUT BİLGİLERİ KARTI ---
            _buildInfoCard(
              title: 'Konut Bilgileri',
              items: [
                _InfoItem(
                  icon: Icons.domain,
                  label: 'Site Adı',
                  value: user.siteName,
                ),
                // User modelinde null gelme ihtimaline karşı kontrol:
                _InfoItem(
                  icon: Icons.location_on_outlined,
                  label: 'Adres',
                  value: user.siteAddress.isNotEmpty ? user.siteAddress : '-',
                ),
                _InfoItem(
                  icon: Icons.location_city,
                  label: 'Blok',
                  value: user.blockNo ?? '-',
                ),
                _InfoItem(
                  icon: Icons.door_front_door,
                  label: 'Daire No',
                  value: user.apartmentNo ?? '-',
                ),
              ],
            ),

            // --- İLETİŞİM BİLGİLERİ KARTI ---
            _buildInfoCard(
              title: 'İletişim Bilgileri',
              items: [
                _InfoItem(
                  icon: Icons.phone,
                  label: 'Telefon',
                  value: user.phoneNumber,
                ),
                _InfoItem(
                  icon: Icons.email,
                  label: 'E-posta',
                  value: user.email.isEmpty ? '-' : user.email,
                ),
                _InfoItem(
                  icon: Icons.directions_car,
                  label: 'Plaka No',
                  value: user.plates ?? '-',
                ),
              ],
            ),

            const SizedBox(height: 30),

            // --- ÇIKIŞ BUTONU ---
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _showLogoutDialog(context, ref),
                  icon: const Icon(Icons.logout),
                  label: const Text('Oturumu Kapat'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.red[700],
                    elevation: 2,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.red.shade100),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  // Çıkış Onay Dialogu
  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Çıkış Yap'),
        content: const Text(
          'Uygulamadan çıkış yapmak istediğinize emin misiniz?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('İptal', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx); // Dialogu kapat
              ref
                  .read(authStateProvider.notifier)
                  .logout(); // Çıkış işlemini tetikle
              // Router otomatik olarak Login ekranına atacak
            },
            child: const Text('Çıkış Yap', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  // Bilgi Kartı Yapısı
  Widget _buildInfoCard({
    required String title,
    required List<_InfoItem> items,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
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
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A4F70),
              ),
            ),
          ),
          const Divider(height: 1),
          ...items.map(
            (item) => ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blueGrey[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  item.icon,
                  size: 20,
                  color: const Color(0xFF1A4F70),
                ),
              ),
              title: Text(
                item.value,
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
              subtitle: Text(item.label, style: const TextStyle(fontSize: 12)),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoItem {
  final IconData icon;
  final String label;
  final String value;
  _InfoItem({required this.icon, required this.label, required this.value});
}
