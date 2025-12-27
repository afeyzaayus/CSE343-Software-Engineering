import 'package:dio/dio.dart';
import '../models/social_amenity.dart';

/// Repository responsible for fetching social facilities and amenities data.
class SocialRepo {
  SocialRepo(this._dio);
  final Dio _dio;

  /// Fetches the list of available social amenities for a specific site.
  ///
  /// Returns an empty list if the response data format is unexpected.
  /// Throws an exception if the network request fails.
  Future<List<SocialAmenity>> listBySite(dynamic siteId) async {
    try {
      final res = await _dio.get('/api/social-facilities/site/$siteId/social-amenities');
      
      final data = res.data['data'];

      if (data is List) {
        return data.map((e) => SocialAmenity.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      // Propagate error to the controller to handle UI feedback properly
      rethrow;
    }
  }
}