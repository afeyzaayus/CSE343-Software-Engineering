class User {
  final String id;
  final String name;
  final String email;
  final String phoneNumber; // Email yerine phone_number yaptım
  final String siteId;
  final String siteName;
  final String? blockNo; // Yeni ekledim (Backend'de var)
  final String? apartmentNo; // Yeni ekledim (Backend'de var)

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.phoneNumber,
    required this.siteId,
    required this.siteName,
    this.blockNo,
    this.apartmentNo,
  });

  factory User.fromJson(Map<String, dynamic> j) => User(
    // 1. HATA BURADAYDI: id int geliyor, toString() ile String yaptık.
    id: j['id'].toString(),

    // 2. Backend 'full_name' gönderiyor, onu alıyoruz.
    name: j['full_name'] ?? '',

    email: j['email'] ?? '',

    // 3. Backend 'phone_number' gönderiyor.
    phoneNumber: j['phone_number'] ?? '',

    // 4. siteId int geliyor, toString() ile String yaptık.
    siteId: j['siteId']?.toString() ?? '',

    // 5. Backend'de siteName yoksa boş gelsin
    siteName: j['site_name'] ?? '',

    // Ekstra alanlar (İsteğe bağlı)
    blockNo: j['block_no']?.toString(),
    apartmentNo: j['apartment_no']?.toString(),
  );
}
