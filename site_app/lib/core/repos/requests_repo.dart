import 'package:dio/dio.dart';
import '../models/request_ticket.dart';

class RequestsRepo {
  RequestsRepo(this._dio);
  final Dio _dio;

  Future<List<RequestTicket>> listMine(String userId) async {
    final res = await _dio.get('/api/users/$userId/requests');
    return (res.data as List).map((e) => RequestTicket.fromJson(e)).toList();
  }

  Future<void> create({required String siteId, required String title, required String description}) async {
    await _dio.post('/api/sites/$siteId/requests', data: {
      'title': title,
      'description': description,
    });
  }
}
