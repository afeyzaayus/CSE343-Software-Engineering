import 'package:dio/dio.dart';
import '../models/payment.dart';

class PaymentsRepo {
  PaymentsRepo(this._dio);
  final Dio _dio;

  Future<List<Payment>> listMine(String userId) async {
    try {
      // DÜZELTME: URL artık /api/payments/user/ID
      final res = await _dio.get('/api/payments/user/$userId');
      
      // Backend: { success: true, data: [...] }
      final data = res.data['data'];

      if (data is List) {
        return data.map((e) => Payment.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      print("Ödeme geçmişi hatası: $e");
      return [];
    }
  }
}