import 'package:dio/dio.dart';
import '../models/announcement.dart';

/// Repository responsible for fetching announcement data from the backend.
class AnnouncementsRepo {
  AnnouncementsRepo(this._dio);
  final Dio _dio;

  /// Fetches a list of announcements for a specific site.
  ///
  /// Handles different response structures (Flat List vs. Grouped 'active' Map).
  /// Returns an empty list if [siteId] is invalid or data format is unexpected.
  Future<List<Announcement>> listBySite(String siteId) async {
    if (siteId.trim().isEmpty) {
      return [];
    }

    try {
      final res = await _dio.get('/api/sites/$siteId/announcements');
      final data = res.data['data'];

      // Scenario 1: Backend returns a grouped object (e.g., { "active": [], "past": [] })
      if (data is Map<String, dynamic>) {
        final activeList = data['active'];
        if (activeList is List) {
          return activeList.map((e) => Announcement.fromJson(e)).toList();
        }
      } 
      // Scenario 2: Backend returns a flat list of announcements
      else if (data is List) {
        return data.map((e) => Announcement.fromJson(e)).toList();
      }

      return [];
    } catch (e) {
      // Propagate the error to be handled by the controller/UI layer
      rethrow;
    }
  }

  /// Fetches the details of a single announcement by its ID.
  Future<Announcement> getById(String siteId, String annId) async {
    try {
      final res = await _dio.get('/api/sites/$siteId/announcements/$annId');
      return Announcement.fromJson(res.data['data']);
    } catch (e) {
      rethrow;
    }
  }
}