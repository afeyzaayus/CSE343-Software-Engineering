class Payment {
  final int id;
  final String userId;
  final String siteId;
  final double amount;
  final DateTime paymentDate; // Backend'deki 'due_date' (Son Ödeme Tarihi)
  final String? paymentMethod; // Ödenmemişse null olabilir
  final String status; // 'PAID', 'UNPAID', 'OVERDUE'
  final int month; // Filtreleme için gerekli
  final int year;  // Filtreleme için gerekli
  final String description; // UI'da göstermek için

  Payment({
    required this.id,
    required this.userId,
    required this.siteId,
    required this.amount,
    required this.paymentDate,
    this.paymentMethod,
    required this.status,
    required this.month,
    required this.year,
    required this.description,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    // Backend'den gelen 'due_date' veya 'created_at' bilgisini alıyoruz
    DateTime parsedDate;
    if (json['due_date'] != null) {
      parsedDate = DateTime.parse(json['due_date'].toString());
    } else if (json['created_at'] != null) {
      parsedDate = DateTime.parse(json['created_at'].toString());
    } else {
      parsedDate = DateTime.now();
    }

    // Backend'den gelen ay ve yıl bilgileri
    final int valMonth = int.tryParse(json['month'].toString()) ?? parsedDate.month;
    final int valYear = int.tryParse(json['year'].toString()) ?? parsedDate.year;

    // Description alanı genelde aidat tablosunda olmaz, biz üretiyoruz
    String generatedDesc = json['description']?.toString() ?? '';
    if (generatedDesc.isEmpty) {
      // İngilizce ay isimleri veya basitçe "Aidat"
      generatedDesc = '$valYear / $valMonth - Monthly Dues'; 
    }

    return Payment(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      
      // Prisma genelde camelCase döner (userId), ama snake_case (user_id) kontrolü de yapalım
      userId: json['userId']?.toString() ?? json['user_id']?.toString() ?? '',
      siteId: json['siteId']?.toString() ?? json['site_id']?.toString() ?? '',
      
      amount: double.tryParse(json['amount'].toString()) ?? 0.0,
      
      paymentDate: parsedDate,
      
      // Status genelde 'payment_status' olarak gelir
      status: json['payment_status']?.toString() ?? 'UNPAID',
      
      paymentMethod: json['payment_method']?.toString(), // Null olabilir
      
      month: valMonth,
      year: valYear,
      description: generatedDesc,
    );
  }
}