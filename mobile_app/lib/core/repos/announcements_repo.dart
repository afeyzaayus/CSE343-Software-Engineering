import 'package:dio/dio.dart';
import '../models/announcement.dart';

class AnnouncementsRepo {
  AnnouncementsRepo(this._dio);
  final Dio _dio;

  Future<List<Announcement>> listBySite(String siteId) async {
    final res = await _dio.get('/api/sites/$siteId/announcements');
    return (res.data as List).map((e) => Announcement.fromJson(e)).toList();
  }

  Future<Announcement> getById(String siteId, String annId) async {
    final res = await _dio.get('/api/sites/$siteId/announcements/$annId');
    return Announcement.fromJson(res.data);
  }
}
