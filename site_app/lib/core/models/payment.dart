class Payment {
  final String id;
  final int year;
  final String month; // "Eylül" gibi ya da "09"
  final double amount;
  final String currency; // "TRY"
  final bool paid;
  Payment({required this.id, required this.year, required this.month, required this.amount, required this.currency, required this.paid});

  factory Payment.fromJson(Map<String,dynamic> j) => Payment(
    id: j['id'], year: j['year'], month: j['month'],
    amount: (j['amount'] as num).toDouble(), currency: j['currency'],
    paid: j['paid'] as bool,
  );
}
