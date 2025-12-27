/// Represents a payment transaction or dues record.
class Payment {
  final int id;
  final String userId;
  final String siteId;
  final double amount;
  final DateTime paymentDate;
  final String? paymentMethod;
  final String status;
  final int month;
  final int year;
  final String description;

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

  /// Creates a [Payment] instance from a JSON map.
  /// 
  /// Handles fallback logic for dates, description generation, and 
  /// varying key formats (e.g., camelCase vs snake_case).
  factory Payment.fromJson(Map<String, dynamic> json) {
    // Determine the relevant date string safely
    final dateStr = json['due_date']?.toString() ?? json['created_at']?.toString();
    final parsedDate = DateTime.tryParse(dateStr ?? '') ?? DateTime.now();

    final int valMonth = int.tryParse(json['month'].toString()) ?? parsedDate.month;
    final int valYear = int.tryParse(json['year'].toString()) ?? parsedDate.year;

    // Generate a default description if none is provided
    String desc = json['description']?.toString() ?? '';
    if (desc.isEmpty) {
      desc = '$valYear / $valMonth - Monthly Dues';
    }

    return Payment(
      id: int.tryParse(json['id'].toString()) ?? 0,
      
      // Support both camelCase and snake_case keys for IDs
      userId: json['userId']?.toString() ?? json['user_id']?.toString() ?? '',
      siteId: json['siteId']?.toString() ?? json['site_id']?.toString() ?? '',
      
      amount: double.tryParse(json['amount'].toString()) ?? 0.0,
      
      paymentDate: parsedDate,
      
      // Default to 'UNPAID' if status is missing
      status: json['payment_status']?.toString() ?? 'UNPAID',
      
      paymentMethod: json['payment_method']?.toString(),
      
      month: valMonth,
      year: valYear,
      description: desc,
    );
  }
}