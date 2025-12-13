import 'package:dio/dio.dart';
import '../models/request_ticket.dart';

class RequestsRepo {
  RequestsRepo(this._dio);
  final Dio _dio;

  // siteId artık String (Kod) olarak gidiyor
  Future<List<RequestTicket>> listMine({required String userId, required String siteId}) async {
    try {
      final res = await _dio.get(
        '/api/complaints/user/$userId',
        queryParameters: {'siteId': siteId}, // ?siteId=E993EU
      );
      
      final data = res.data['data']; 

      if (data is List) {
        return data.map((e) => RequestTicket.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      print("Talep listesi hatası: $e");
      rethrow;
    }
  }

  // Oluştururken de String gönderiyoruz
  Future<void> create({
    required String title,
    required String content,
    required String category,
    required String siteId, // String yapıldı
    required String userId, // String yapıldı (Genelde ID string tutuluyor modelinde)
  }) async {
    await _dio.post('/api/complaints', data: {
      'title': title,
      'content': content,
      'category': category,
      'siteId': siteId, // "E993EU"
      'userId': userId, // "2"
    });
  }
}