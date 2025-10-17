import 'package:dio/dio.dart';

class SocialAmenity {
  final String id;
  final String name;
  final String rules;
  SocialAmenity({required this.id, required this.name, required this.rules});
  factory SocialAmenity.fromJson(Map<String,dynamic> j) =>
      SocialAmenity(id: j['id'].toString(), name: j['name'] ?? '', rules: j['rules'] ?? '');
}

class SocialRepo {
  SocialRepo(this._dio);
  final Dio _dio;

  Future<List<SocialAmenity>> listBySite(String siteId) async {
    final r = await _dio.get('/api/sites/$siteId/social-amenities');
    return (r.data as List).map((e) => SocialAmenity.fromJson(e)).toList();
  }
}
