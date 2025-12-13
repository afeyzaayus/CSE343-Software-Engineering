import 'package:dio/dio.dart';
import '../models/social_amenity.dart';

class SocialRepo {
  SocialRepo(this._dio);
  final Dio _dio;

  Future<List<SocialAmenity>> listBySite(dynamic siteId) async {
    try {
      // Loglarda '5' gördüm, bu yüzden siteId'yi olduğu gibi gönderiyoruz.
      final res = await _dio.get('/api/sites/$siteId/social-amenities');
      
      final data = res.data['data'];

      if (data is List) {
        return data.map((e) => SocialAmenity.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      print("Sosyal tesis hatası: $e");
      return []; // Hata olursa boş liste dön, uygulama çökmesin.
    }
  }
}