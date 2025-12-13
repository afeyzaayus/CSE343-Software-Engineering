class User {
  final String id;
  final String name;
  final String email;
  final String phoneNumber;
  final String siteId;     // Veritabanı ID'si (Örn: "5")
  final String siteCode;   // Site Kodu (Örn: "E993EU") - Backend'den geliyorsa
  final String siteName;   // Site Adı (Örn: "Gül4")
  final String? blockNo;   // Backend 'block_id' gönderiyor
  final String? apartmentNo;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.phoneNumber,
    required this.siteId,
    required this.siteCode,
    required this.siteName,
    this.blockNo,
    this.apartmentNo,
  });

  factory User.fromJson(Map<String, dynamic> j) {
    return User(
      // 1. ID: Backend int gönderiyor, String'e çeviriyoruz
      id: j['id'].toString(),

      // 2. İsim: Backend 'full_name' gönderiyor
      name: j['full_name'] ?? '',

      // 3. Email: Backend göndermiyorsa boş string
      email: j['email'] ?? '',

      // 4. Telefon: Backend 'phone_number' gönderiyor
      phoneNumber: j['phone_number'] ?? '',

      // 5. Site ID: Ana objede 'siteId' (int) olarak var
      siteId: j['siteId']?.toString() ?? '',

      // --- İÇ İÇE OBJE PARSING (ÖNEMLİ) ---
      // Backend cevabında "site": { "site_name": "...", "site_id": "..." } var.
      // Bu yüzden j['site'] üzerinden erişiyoruz.

      // Site Adı:
      siteName: j['site']?['site_name'] ?? '',

      // Site Kodu (E993EU): Eğer backend login servisine eklediysen buradan gelir.
      // Eklemediysen boş gelir, uygulama çökmez.
      siteCode: j['site']?['site_id'] ?? '',

      // ------------------------------------

      // 6. Blok: Backend loglarında 'block_id' görünüyor
      blockNo: j['block_id']?.toString(),

      // 7. Daire: Backend 'apartment_no' gönderiyor
      apartmentNo: j['apartment_no']?.toString(),
    );
  }
}