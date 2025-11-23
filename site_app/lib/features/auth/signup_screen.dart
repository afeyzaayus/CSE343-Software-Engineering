import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_controller.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _f = GlobalKey<FormState>();

  final fullname = TextEditingController();
  final email = TextEditingController();
  final phone = TextEditingController();
  final pass = TextEditingController();
  final siteId = TextEditingController();
  final blockNo = TextEditingController();
  final apartmentNo = TextEditingController();

  // Dialog içindeki kod alanı için controller
  final _otpController = TextEditingController(); 

  @override
  void dispose() {
    // Controller'ları temizlemek iyi bir pratiktir
    fullname.dispose();
    email.dispose();
    phone.dispose();
    pass.dispose();
    siteId.dispose();
    blockNo.dispose();
    apartmentNo.dispose();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Sign Up')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _f,
          child: ListView(
            children: [
              TextFormField(
                controller: fullname,
                decoration: const InputDecoration(labelText: 'Full Name'),
                validator: _req,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: email,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: _req,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: phone,
                decoration: const InputDecoration(labelText: 'Phone Number'),
                validator: _req,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: pass,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: _req,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: siteId,
                decoration: const InputDecoration(labelText: 'Site ID'),
                validator: _req,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: blockNo,
                decoration: const InputDecoration(labelText: 'Block No (optional)'),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: apartmentNo,
                decoration: const InputDecoration(labelText: 'Apartment No (optional)'),
              ),
              if (auth.error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    auth.error!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              const SizedBox(height: 16),
              
              // --- KAYIT OL BUTONU ---
              FilledButton(
                onPressed: () async {
                  if (_f.currentState!.validate()) {
                    
                    // 1. Controller'ı çağır ve sonucu bekle (bool dönecek)
                    final success = await ref.read(authStateProvider.notifier).signup(
                          fullName: fullname.text,
                          email: email.text,
                          phoneNumber: phone.text,
                          password: pass.text,
                          siteId: siteId.text,
                          blockNo: blockNo.text.isNotEmpty ? blockNo.text : null,
                          apartmentNo: apartmentNo.text.isNotEmpty ? apartmentNo.text : null,
                        );

                    // 2. Eğer başarılıysa (ve ekran hala açıksa) Dialog'u göster
                    if (success && context.mounted) {
                      _showOtpDialog();
                    }
                  }
                },
                child: const Text('Create Account'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- OTP DIALOG PENCERESİ ---
  void _showOtpDialog() {
    _otpController.clear(); // Her açılışta temizle

    showDialog(
      context: context,
      barrierDismissible: false, // Dışarı tıklayınca kapanmasın
      builder: (ctx) => AlertDialog(
        title: const Text("Telefon Doğrulama"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text("${phone.text} numarasına gelen kodu giriniz:"),
            const SizedBox(height: 16),
            TextField(
              controller: _otpController,
              keyboardType: TextInputType.number,
              maxLength: 6, // Kod uzunluğu (Backend'e göre ayarla)
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: "Kodu giriniz",
                counterText: "", // Altındaki sayacı gizle
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx), // İptal
            child: const Text("İptal"),
          ),
          ElevatedButton(
            onPressed: () async {
              // Dialog içindeki Onayla butonu
              final authNotifier = ref.read(authStateProvider.notifier);
              
              // Verify isteği at
              final isVerified = await authNotifier.verifyOtp(
                phone.text, 
                _otpController.text
              );

              if (isVerified && context.mounted) {
                Navigator.pop(ctx); // Dialog'u kapat
                Navigator.pop(context); // Sign Up ekranını kapat (Geri dön)
                
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text("Hesabınız doğrulandı! Giriş yapabilirsiniz."),
                    backgroundColor: Colors.green,
                  ),
                );
              } else {
                // Hata mesajı (Controller state.error'a yazar ama biz Snackbar gösterelim)
                ScaffoldMessenger.of(ctx).showSnackBar(
                  const SnackBar(content: Text("Hatalı kod veya işlem başarısız.")),
                );
              }
            },
            child: const Text("Onayla"),
          ),
        ],
      ),
    );
  }

  String? _req(String? v) => (v == null || v.isEmpty) ? 'Required' : null;
}
