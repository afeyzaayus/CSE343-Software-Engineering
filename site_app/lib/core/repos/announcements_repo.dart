import 'package:dio/dio.dart';
import '../models/announcement.dart';

class AnnouncementsRepo {
  AnnouncementsRepo(this._dio);
  final Dio _dio;

  Future<List<Announcement>> listBySite(String siteId) async {
    if (siteId.isEmpty) {
      print("HATA: listBySite fonksiyonuna boş siteId geldi!");
      return []; 
    }

    try {
      final res = await _dio.get('/api/sites/$siteId/announcements');
      
      // Backend'den gelen yapı: { "active": [], "past": [], "all": [] }
      final data = res.data['data'];

      // 1. Önce Map mi diye kontrol et (Yeni backend yapısı)
      if (data is Map) {
        // Test için 'all' (hepsi) listesini çekelim.
        // Daha sonra sadece aktifleri istersen burayı 'active' yaparsın.
        final list = data['active']; 
        
        if (list is List) {
           return list.map((e) => Announcement.fromJson(e)).toList();
        }
      } 
      // 2. Belki backend ilerde düz liste dönerse diye eski kontrolü de tutalım
      else if (data is List) {
        return data.map((e) => Announcement.fromJson(e)).toList();
      }

      // Hiçbiri değilse boş dön
      return [];

    } catch (e) {
      print("Duyuru listesi hatası: $e");
      rethrow;
    }
  }

  Future<Announcement> getById(String siteId, String annId) async {
    final res = await _dio.get('/api/sites/$siteId/announcements/$annId');
    return Announcement.fromJson(res.data['data']);
  }
}