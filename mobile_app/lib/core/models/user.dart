class User {
  final String id;
  final String name;
  final String email;
  final String siteId;
  final String siteName;
  User({required this.id, required this.name, required this.email, required this.siteId, required this.siteName});

  factory User.fromJson(Map<String, dynamic> j) => User(
    id: j['id'], name: j['name'], email: j['email'], siteId: j['siteId']?.toString() ?? '', siteName: j['siteName'] ?? '',
  );
}
