import 'package:dio/dio.dart';
import '../models/payment.dart';

class PaymentsRepo {
  PaymentsRepo(this._dio);
  final Dio _dio;

  Future<List<Payment>> listMine(String userId) async {
    final res = await _dio.get('/api/users/$userId/fees');
    return (res.data as List).map((e) => Payment.fromJson(e)).toList();
  }

  Future<void> markPaid({required String userId, required String feeId}) async {
    await _dio.put('/api/users/$userId/fees/$feeId/pay');
  }
}
