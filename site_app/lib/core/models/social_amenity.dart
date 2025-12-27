/// Represents a shared social facility or amenity within the site (e.g., Gym, Pool, Sauna).
class SocialAmenity {
  final String id;
  final String name;
  final String description;
  final String status;
  final String hours;
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

  /// Factory constructor to create a [SocialAmenity] from a JSON map.
  ///
  /// Safely handles null values and converts ID types to String.
  factory SocialAmenity.fromJson(Map<String, dynamic> json) {
    return SocialAmenity(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? 'Unnamed Amenity',
      description: json['description'] ?? '',
      status: json['status'] ?? 'Unknown',
      hours: json['hours'] ?? '',
      rules: json['rules'] ?? '',
      extra: json['extra'] ?? '',
    );
  }
}