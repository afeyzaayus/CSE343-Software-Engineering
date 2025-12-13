class SocialAmenity {
  final String id;
  final String name;
  final String description;
  final String status; // "Açık", "Kapalı" vs.
  final String hours;  // "09:00-22:00"
  final String rules;
  final String extra;

  SocialAmenity({
    required this.id,
    required this.name,
    required this.description,
    required this.status,
    required this.hours,
    required this.rules,
    required this.extra,
  });

  factory SocialAmenity.fromJson(Map<String, dynamic> json) {
    return SocialAmenity(
      // Backend id'yi string veya int dönebilir, garantiye alalım:
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? 'İsimsiz Tesis',
      description: json['description'] ?? '',
      status: json['status'] ?? 'Bilinmiyor',
      hours: json['hours'] ?? '',
      rules: json['rules'] ?? '',
      extra: json['extra'] ?? '',
    );
  }
}