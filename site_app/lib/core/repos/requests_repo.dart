import 'package:dio/dio.dart';
import '../models/request_ticket.dart';

/// Repository responsible for managing support tickets and complaints.
class RequestsRepo {
  RequestsRepo(this._dio);
  final Dio _dio;

  /// Fetches the list of tickets submitted by the current user.
  ///
  /// Returns a list of [RequestTicket] objects.
  Future<List<RequestTicket>> listMine({
    required String userId,
    required String siteId,
  }) async {
    // Avoid making requests with invalid identifiers
    if (userId.isEmpty) return [];

    try {
      final res = await _dio.get(
        '/api/complaints/user/$userId',
        queryParameters: {'siteId': siteId},
      );

      final data = res.data['data'];

      if (data is List) {
        return data.map((e) => RequestTicket.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      // Propagate error to controller for UI handling
      rethrow;
    }
  }

  /// Submits a new support ticket or complaint to the backend.
  Future<void> create({
    required String title,
    required String content,
    required String category,
    required String siteId,
    required String userId,
  }) async {
    try {
      await _dio.post(
        '/api/complaints',
        data: {
          'title': title,
          'content': content,
          'category': category,
          'siteId': siteId,
          'userId': userId,
        },
      );
    } catch (e) {
      // Propagate error to controller for UI handling
      rethrow;
    }
  }
}