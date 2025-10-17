import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/dio_provider.dart';
import '../../core/repos/payments_repo.dart';
import '../../core/models/payment.dart';

/// Repo provider
final paymentsRepoProvider =
    Provider<PaymentsRepo>((ref) => PaymentsRepo(ref.read(dioProvider)));

/// Seçili yıla göre ödemeleri getiren provider (listeyi backend'den alıp yıl bazında filtreler)
final paymentsByYearProvider =
    FutureProvider.family<List<Payment>, int>((ref, year) async {
  final user = ref.read(authStateProvider).user!;
  final repo = ref.read(paymentsRepoProvider);

  final all = await repo.listMine(user.id); // /api/users/{userId}/fees
  // Yıla göre filtrele, (opsiyonel) ay sıralaması: ödenmemişler üstte
  final filtered = all.where((p) => p.year == year).toList()
    ..sort((a, b) {
      // önce ödenmemişler gelsin, sonra ödenenler
      if (a.paid != b.paid) return a.paid ? 1 : -1;
      return a.month.compareTo(b.month); // backend ayı "01, 02" vs dönüyorsa zaten doğru sıralanır
    });
  return filtered;
});

class PaymentsScreen extends ConsumerStatefulWidget {
  const PaymentsScreen({super.key});
  @override
  ConsumerState<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends ConsumerState<PaymentsScreen> {
  int year = DateTime.now().year;

  @override
  Widget build(BuildContext context) {
    final asyncPayments = ref.watch(paymentsByYearProvider(year));

    return Scaffold(
      appBar: AppBar(title: const Text('Payments')),
      body: Column(
        children: [
          // Yıl seçimi
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                const Text('Year:'),
                const SizedBox(width: 8),
                DropdownButton<int>(
                  value: year,
                  items: [
                    for (final y in List.generate(6, (i) => DateTime.now().year - i))
                      DropdownMenuItem(value: y, child: Text('$y')),
                  ],
                  onChanged: (v) {
                    if (v == null) return;
                    setState(() => year = v);
                    // provider family parametresi değiştiği için otomatik yeniden fetch/filter olur
                  },
                ),
                const Spacer(),
                // Özet (ödenmemiş sayısı vb.) – data geldiyse göster
                asyncPayments.maybeWhen(
                  data: (list) {
                    final unpaid = list.where((p) => !p.paid).length;
                    return Text('Unpaid: $unpaid');
                  },
                  orElse: () => const SizedBox.shrink(),
                ),
              ],
            ),
          ),

          // Liste
          Expanded(
            child: asyncPayments.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, st) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Failed to load fees.'),
                      const SizedBox(height: 8),
                      FilledButton(
                        onPressed: () =>
                            ref.invalidate(paymentsByYearProvider(year)),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
              data: (items) {
                if (items.isEmpty) {
                  return RefreshIndicator(
                    onRefresh: () async =>
                        ref.invalidate(paymentsByYearProvider(year)),
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: const [
                        SizedBox(height: 160),
                        Center(child: Text('No fees for this year.')),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async =>
                      ref.invalidate(paymentsByYearProvider(year)),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final p = items[i];
                      return ListTile(
                        leading: Icon(
                          p.paid ? Icons.check_circle : Icons.cancel,
                          color: p.paid ? Colors.green : Colors.red,
                        ),
                        title: Text('${p.month} - ${p.amount.toStringAsFixed(0)} ${p.currency}'),
                        subtitle: Text(p.paid ? 'Paid' : 'Unpaid'),
                        // Not: Bu ekranda ödeme yapılmıyor; sadece görüntülüyorsun.
                        // Eğer ileride "Mark as paid" gibi bir aksiyon eklersen:
                        // trailing: !p.paid ? TextButton(onPressed: ..., child: const Text('Mark Paid')) : null,
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
