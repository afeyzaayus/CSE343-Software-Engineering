/// Represents an announcement or notification entity displayed in the application.
class Announcement {
  final int id;
  final String title;
  final String body;
  final DateTime createdAt;

  Announcement({
    required this.id,
    required this.title,
    required this.body,
    required this.createdAt,
  });

  /// Factory constructor to create an [Announcement] instance from a JSON map.
  ///
  /// Maps the backend's 'content' field to the local 'body' property.
  /// Uses [DateTime.tryParse] to prevent crashes on invalid date formats.
  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      body: json['content'] ?? '',
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}