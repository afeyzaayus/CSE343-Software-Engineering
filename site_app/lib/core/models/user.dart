import 'payment.dart';

/// Represents the authenticated user profile, including personal details,
/// site information, and apartment specifics.
class User {
  final String id;
  final String name;
  final String email;
  final String phoneNumber;
  
  // Site & Residence Details
  final String siteId;
  final String siteCode;
  final String siteName;
  final String siteAddress;
  final String? blockName;
  final String? apartmentNo;
  final String? plates;
  
  final List<Payment> payments;

  User({
    required this.id,
    required this.name,
    this.payments = const [],
    required this.email,
    required this.phoneNumber,
    required this.siteId,
    required this.siteCode,
    required this.siteName,
    required this.siteAddress,
    this.blockName,
    this.apartmentNo,
    this.plates,
  });

  /// Factory constructor to create a [User] instance from a JSON map.
  /// 
  /// Handles nested 'site' objects and maps 'monthlyDues' to the payments list.
  factory User.fromJson(Map<String, dynamic> json) {
    // Safely extract the nested site object
    final siteData = json['site'] is Map<String, dynamic> ? json['site'] : null;
    final blockData = json['blocks'] is Map<String, dynamic> ? json['blocks'] : null;

    return User(
      id: json['id']?.toString() ?? '',
      name: json['full_name'] ?? json['name'] ?? '',
      email: json['email'] ?? '',
      phoneNumber: json['phone_number'] ?? '',
      
      // Handle potential key variations (camelCase vs snake_case)
      siteId: json['siteId']?.toString() ?? json['site_id']?.toString() ?? '',
      
      // Extract details from the nested site object
      siteName: siteData?['site_name'] ?? '',
      siteCode: siteData?['site_id']?.toString() ?? siteData?['code'] ?? '', 
      siteAddress: siteData?['site_address'] ?? '',

      blockName: blockData?['block_name']?.toString() ?? json['block_id']?.toString(),
      
      plates: json['plates']?.toString(),
      apartmentNo: json['apartment_no']?.toString(),

      payments: (json['monthlyDues'] as List?)
              ?.map((e) => Payment.fromJson(e))
              .toList() ??
          [],
    );
  }
}