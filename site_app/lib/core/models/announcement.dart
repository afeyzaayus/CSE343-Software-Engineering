class Announcement {
  final int id;
  final String title;
  final String body; // UI tarafında 'body' kullanıyorsun
  final DateTime createdAt;

  Announcement({
    required this.id,
    required this.title,
    required this.body,
    required this.createdAt,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      
      // DÜZELTME 1: Backend 'content' gönderiyor, biz 'body' değişkenine atıyoruz.
      body: json['content'] ?? '', 
      
      // DÜZELTME 2: Backend 'created_at' gönderiyor.
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : DateTime.now(),
    );
  }
}