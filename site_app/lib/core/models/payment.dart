class Payment {
  final int id;
  final String userId;
  final String siteId;
  final double amount;
  final DateTime paymentDate;
  final String paymentMethod; // "CREDIT_CARD", "CASH" vs.
  final String description;

  Payment({
    required this.id,
    required this.userId,
    required this.siteId,
    required this.amount,
    required this.paymentDate,
    required this.paymentMethod,
    required this.description,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      userId: json['user_id']?.toString() ?? '', // Backend snake_case dönebilir
      siteId: json['site_id']?.toString() ?? '',
      
      // Sayısal değerleri güvenli çevirme
      amount: double.tryParse(json['amount'].toString()) ?? 0.0,
      
      paymentDate: json['payment_date'] != null 
          ? DateTime.parse(json['payment_date']) 
          : DateTime.now(),
          
      paymentMethod: json['payment_method'] ?? 'Bilinmiyor',
      description: json['description'] ?? '',
    );
  }
}