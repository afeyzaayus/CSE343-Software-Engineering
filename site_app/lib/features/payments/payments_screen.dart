import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/models/payment.dart';

// --- EKRAN ---
class PaymentsScreen extends ConsumerStatefulWidget {
  const PaymentsScreen({super.key});

  @override
  ConsumerState<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends ConsumerState<PaymentsScreen> {
  // Varsayılan olarak bugünün yıl ve ayını seçili getir
  int _selectedYear = DateTime.now().year;
  int _selectedMonth = DateTime.now().month;

  @override
  Widget build(BuildContext context) {
    // 1. Kullanıcı verisini AuthState içinden çekiyoruz (YÖNTEM 1)
    final user = ref.watch(authStateProvider).user;

    // Kullanıcı henüz yüklenmediyse loading göster
    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    // 2. Kullanıcının ödeme listesini seçili tarihe göre filtrele
    // Not: Payment modelinde 'year' ve 'month' alanları backend'den geliyor.
    // Eğer modelinde bu alanlar yoksa p.paymentDate.year şeklinde kullanabilirsin.
    final filteredPayments = user.payments.where((p) {
      return p.year == _selectedYear && p.month == _selectedMonth;
    }).toList();

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('Payment History'),
        backgroundColor: const Color(0xFF1A4F70), // Kurumsal Mavi
        foregroundColor: Colors.white,
        centerTitle: true,
        elevation: 0,
      ),
      body: Column(
        children: [
          // FİLTRE ALANI
          _buildFilterBar(),

          // LİSTE ALANI
          Expanded(
            child: filteredPayments.isEmpty
                ? _buildEmptyState()
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredPayments.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, i) {
                      return _PaymentCard(payment: filteredPayments[i]);
                    },
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
                      child: Text("$year",
                          style: const TextStyle(fontWeight: FontWeight.bold)),
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
                    // Ay isimleri İngilizce (January, February...)
                    final monthName = DateFormat.MMMM('en_US')
                        .format(DateTime(2024, monthIndex));
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
          Icon(Icons.receipt_long, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
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
    // Para birimi ve Tarih formatı (İngilizce)
    final currencyFormat = NumberFormat.currency(locale: 'en_US', symbol: '₺');
    final dateFormat = DateFormat('dd MMM yyyy', 'en_US');

    // Status Kontrolü (Backend'den gelen payment_status'e göre)
    // Eğer payment_status "PAID" ise ödendi kabul et
    final status = payment.status?.toUpperCase() ?? 'UNPAID';
    final isPaid = status == 'PAID';
    final isOverdue = status == 'OVERDUE';

    Color statusColor;
    IconData statusIcon;
    String statusText;

    if (isPaid) {
      statusColor = Colors.green;
      statusIcon = Icons.check_circle;
      statusText = 'PAID';
    } else if (isOverdue) {
      statusColor = Colors.red;
      statusIcon = Icons.warning_amber_rounded;
      statusText = 'OVERDUE';
    } else {
      statusColor = Colors.orange;
      statusIcon = Icons.hourglass_empty;
      statusText = 'UNPAID';
    }

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
          // 1. SOL: DURUM İKONU
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              statusIcon,
              color: statusColor,
              size: 24,
            ),
          ),

          const SizedBox(width: 16),

          // 2. ORTA: AÇIKLAMA VE TARİH
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  // Eğer description boşsa varsayılan metin
                  payment.description.isNotEmpty 
                      ? payment.description 
                      : 'Monthly Dues',
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

          // 3. SAĞ: TUTAR VE ETİKET
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
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  statusText,
                  style: TextStyle(
                    color: statusColor,
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