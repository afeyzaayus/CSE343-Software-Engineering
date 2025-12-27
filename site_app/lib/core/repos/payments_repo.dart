import 'package:dio/dio.dart';
import '../models/payment.dart';

/// Repository responsible for fetching payment history and dues records.
class PaymentsRepo {
  PaymentsRepo(this._dio);
  final Dio _dio;

  /// Fetches the list of payments associated with a specific user ID.
  ///
  /// Returns a list of [Payment] objects.
  /// Throws an error if the network request fails, allowing the UI to show an error state.
  Future<List<Payment>> listMine(String userId) async {
    if (userId.isEmpty) return [];

    try {
      final res = await _dio.get('/api/payments/user/$userId');
      final data = res.data['data'];

      if (data is List) {
        return data.map((e) => Payment.fromJson(e)).toList();
      }
      
      return [];
    } catch (e) {
      // Propagate the error to the controller to handle UI feedback (e.g., Snackbars)
      rethrow;
    }
  }
}