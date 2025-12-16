import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/app.dart';
import 'core/storage/secure_storage.dart'; // Import etmeyi unutma

Future<void> main() async {

  WidgetsFlutterBinding.ensureInitialized();

  // --- BU SATIRI EKLE VE UYGULAMAYI BİR KERE ÇALIŞTIR ---
  await SecureStore.clear(); 
  print("🧹 TÜM TOKENLAR SİLİNDİ!");
  // -----------------------------------------------------


  runApp(const ProviderScope(child: SiteApp()));
}
