import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/network/dio_provider.dart';
import '../../core/models/payment.dart';
import '../../core/repos/payments_repo.dart';

// --- PROVIDER TANIMLARI ---
final paymentsRepoProvider = Provider<PaymentsRepo>(
  (ref) => PaymentsRepo(ref.read(dioProvider)),
);

final myPaymentsFutureProvider = FutureProvider.autoDispose<List<Payment>>((ref) async {
  final user = ref.read(authStateProvider).user;
  if (user == null) return [];
  return ref.read(paymentsRepoProvider).listMine(user.id.toString());
});

// --- EKRAN ---
class PaymentsScreen extends ConsumerStatefulWidget {
  const PaymentsScreen({super.key});

  @override
  ConsumerState<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends ConsumerState<PaymentsScreen> {
  int _selectedYear = DateTime.now().year;
  int _selectedMonth = DateTime.now().month;

  @override
  Widget build(BuildContext context) {
    final asyncPayments = ref.watch(myPaymentsFutureProvider);

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('Payment History'), // İNGİLİZCE
        centerTitle: true,
        elevation: 0,
      ),
      body: Column(
        children: [
          // 1. FİLTRE ALANI
          _buildFilterBar(),

          // 2. LİSTE ALANI
          Expanded(
            child: asyncPayments.when(
              data: (allPayments) {
                // Filtreleme
                final filteredPayments = allPayments.where((p) {
                  return p.paymentDate.year == _selectedYear &&
                         p.paymentDate.month == _selectedMonth;
                }).toList();

                if (filteredPayments.isEmpty) {
                  return _buildEmptyState();
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(myPaymentsFutureProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredPayments.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, i) {
                      return _PaymentCard(payment: filteredPayments[i]);
                    },
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, st) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Failed to load data.'), // İNGİLİZCE
                    TextButton(
                      onPressed: () => ref.invalidate(myPaymentsFutureProvider),
                      child: const Text('Retry'), // İNGİLİZCE
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 5),
        ],
      ),
      child: Row(
        children: [
          // YIL DROPDOWN
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<int>(
                  value: _selectedYear,
                  isExpanded: true,
                  icon: const Icon(Icons.calendar_today, size: 16),
                  items: [2024, 2025, 2026].map((year) {
                    return DropdownMenuItem(
                      value: year,
                      // DÜZELTME: "Yılı" kelimesi kaldırıldı, sadece sayı.
                      child: Text("$year", style: const TextStyle(fontWeight: FontWeight.bold)),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedYear = val);
                  },
                ),
              ),
            ),
          ),
          
          const SizedBox(width: 12),

          // AY DROPDOWN
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<int>(
                  value: _selectedMonth,
                  isExpanded: true,
                  icon: const Icon(Icons.arrow_drop_down),
                  items: List.generate(12, (index) {
                    final monthIndex = index + 1;
                    // DÜZELTME: İngilizce ay isimleri (January, February...)
                    final monthName = DateFormat.MMMM('en_US').format(DateTime(2024, monthIndex));
                    return DropdownMenuItem(
                      value: monthIndex,
                      child: Text(monthName),
                    );
                  }),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedMonth = val);
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.filter_list_off, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          // İNGİLİZCE
          Text(
            'No records found for this date.',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}

class _PaymentCard extends StatelessWidget {
  final Payment payment;

  const _PaymentCard({required this.payment});

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'en_US', symbol: '₺');
    final dateFormat = DateFormat('dd MMMM yyyy', 'en_US');

    // Şimdilik sadece geçmiş ödemeleri listelediğimiz için varsayılan olarak "Paid" kabul ediyoruz.
    // İlerde backend'den 'status' alanı gelirse buraya mantık ekleyebiliriz:
    // bool isPaid = payment.status == 'PAID';
    bool isPaid = true; 

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // 1. SOL: İKON KUTUSU (Duruma göre renk değiştirir)
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isPaid ? Colors.green.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isPaid ? Icons.check_circle : Icons.hourglass_empty,
              color: isPaid ? Colors.green : Colors.orange,
              size: 24,
            ),
          ),
          
          const SizedBox(width: 16),

          // 2. ORTA: DETAYLAR
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  payment.description.isNotEmpty ? payment.description : 'Dues Payment',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.calendar_today, size: 12, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Text(
                      dateFormat.format(payment.paymentDate),
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // 3. SAĞ: TUTAR VE STATÜ METNİ
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                currencyFormat.format(payment.amount),
                style: const TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isPaid ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isPaid ? 'PAID' : 'UNPAID',
                  style: TextStyle(
                    color: isPaid ? Colors.green[700] : Colors.red[700],
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}