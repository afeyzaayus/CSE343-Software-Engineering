class Announcement {
  final String id;
  final String title;
  final String body;
  final DateTime createdAt;
  Announcement({required this.id, required this.title, required this.body, required this.createdAt});

  factory Announcement.fromJson(Map<String,dynamic> j) => Announcement(
    id: j['id'], title: j['title'], body: j['body'],
    createdAt: DateTime.parse(j['createdAt']),
  );
}
