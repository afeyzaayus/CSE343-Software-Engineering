import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_controller.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  // Sayfa geçişlerini kontrol etmek için controller
  final PageController _pageController = PageController();
  
  // Hangi adımda olduğumuzu takip etmek için
  int _currentStep = 0;

  // Her adım için ayrı form key (Validasyon için)
  final _formKeyStep1 = GlobalKey<FormState>();
  final _formKeyStep2 = GlobalKey<FormState>();

  // Controller'lar
  final phone = TextEditingController();
  final siteId = TextEditingController();
  
  // Şifre Controller'ları
  final pass = TextEditingController();
  final passConfirm = TextEditingController();

  // OTP Dialog için controller
  final _otpController = TextEditingController();

  @override
  void dispose() {
    phone.dispose();
    siteId.dispose();
    pass.dispose();
    passConfirm.dispose();
    _otpController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  // --- İLERİ BUTONU FONKSİYONU ---
  void _nextStep() {
    if (_formKeyStep1.currentState!.validate()) {
      // Validasyon geçerliyse 2. sayfaya geç
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      setState(() => _currentStep = 1);
    }
  }

  // --- GERİ BUTONU FONKSİYONU ---
  void _prevStep() {
    _pageController.previousPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
    setState(() => _currentStep = 0);
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        appBar: AppBar(
          title: Text(_currentStep == 0 ? 'Hesap Oluştur' : 'Şifre Belirle'),
          centerTitle: true,
          leading: _currentStep == 1 
            ? IconButton(icon: const Icon(Icons.arrow_back), onPressed: _prevStep)
            : null,
        ),
        body: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // Adım göstergesi (Progress Bar)
              LinearProgressIndicator(
                value: (_currentStep + 1) / 2,
                backgroundColor: Colors.grey[200],
                valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).primaryColor),
                minHeight: 6,
                borderRadius: BorderRadius.circular(10),
              ),
              const SizedBox(height: 24),
              
              // Hata mesajı varsa göster
              if (auth.error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.red),
                        const SizedBox(width: 8),
                        Expanded(child: Text(auth.error!, style: const TextStyle(color: Colors.red))),
                      ],
                    ),
                  ),
                ),

              // Sayfa İçeriği (PageView)
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(), // Elle kaydırmayı kapat
                  children: [
                    _buildStep1(), // Adım 1: Kimlik
                    _buildStep2(), // Adım 2: Şifre (Kutucuklar burada)
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- ADIM 1: SİTE ID ve TELEFON ---
  Widget _buildStep1() {
    return Form(
      key: _formKeyStep1,
      child: ListView(
        children: [
          const Text(
            "Lütfen site kodunuzu ve telefon numaranızı giriniz.",
            style: TextStyle(color: Colors.grey, fontSize: 16),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 30),
          
          TextFormField(
            controller: siteId,
            decoration: const InputDecoration(
              labelText: 'Site ID',
              prefixIcon: Icon(Icons.business),
              border: OutlineInputBorder(),
            ),
            textInputAction: TextInputAction.next,
            validator: (v) => (v == null || v.isEmpty) ? 'Site ID zorunludur' : null,
          ),
          const SizedBox(height: 16),
          
          TextFormField(
            controller: phone,
            decoration: const InputDecoration(
              labelText: 'Telefon Numarası',
              prefixIcon: Icon(Icons.phone),
              border: OutlineInputBorder(),
              hintText: "5XX...",
            ),
            keyboardType: TextInputType.phone,
            validator: (v) => (v == null || v.isEmpty) ? 'Telefon zorunludur' : null,
          ),
          const SizedBox(height: 32),
          
          FilledButton(
            onPressed: _nextStep,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Devam Et', style: TextStyle(fontSize: 16)),
          ),
        ],
      ),
    );
  }

  // --- ADIM 2: ŞİFRE BELİRLEME (BURAYI KONTROL EDİN) ---
  Widget _buildStep2() {
    final authState = ref.watch(authStateProvider);
    final isLoading = authState.isLoading;

    return Form(
      key: _formKeyStep2,
      child: ListView(
        children: [
          const Text(
            "Hesabınız için güvenli bir şifre belirleyin.",
            style: TextStyle(color: Colors.grey, fontSize: 16),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 30),

          // --- EKSİK OLAN KISIM BURASIYDI ---
          TextFormField(
            controller: pass,
            decoration: const InputDecoration(
              labelText: 'Şifre',
              prefixIcon: Icon(Icons.lock_outline),
              border: OutlineInputBorder(),
            ),
            obscureText: true, // Şifreyi gizle
            validator: (v) {
              if (v == null || v.length < 6) return 'Şifre en az 6 karakter olmalı';
              return null;
            },
          ),
          const SizedBox(height: 16),
          
          TextFormField(
            controller: passConfirm,
            decoration: const InputDecoration(
              labelText: 'Şifreyi Onayla',
              prefixIcon: Icon(Icons.lock),
              border: OutlineInputBorder(),
            ),
            obscureText: true, // Şifreyi gizle
            validator: (v) {
              if (v != pass.text) return 'Şifreler eşleşmiyor';
              return null;
            },
          ),
          // ------------------------------------

          const SizedBox(height: 32),
          
          if (isLoading)
            const Center(child: CircularProgressIndicator())
          else
            FilledButton(
              onPressed: () async {
                if (_formKeyStep2.currentState!.validate()) {
                  // 1. Önce kayıt işlemini başlat (SMS göndert)
                  final success = await ref.read(authStateProvider.notifier).initiateSignup(
                        phoneNumber: phone.text,
                        siteId: siteId.text,
                      );

                  // 2. Başarılıysa OTP dialogunu aç
                  if (success && context.mounted) {
                    _showOtpDialog();
                  }
                }
              },
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Kaydı Tamamla', style: TextStyle(fontSize: 16)),
            ),
        ],
      ),
    );
  }

  // --- OTP DIALOG ---
  void _showOtpDialog() {
    _otpController.clear();
    showDialog(
      context: context,
      barrierDismissible: false,
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
              maxLength: 6,
              textAlign: TextAlign.center,
              style: const TextStyle(letterSpacing: 4, fontSize: 18, fontWeight: FontWeight.bold),
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: "______",
                counterText: "",
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("İptal"),
          ),
          ElevatedButton(
            onPressed: () async {
              final authNotifier = ref.read(authStateProvider.notifier);
              
              // Şifreyi de göndererek kaydı tamamla
              final isVerified = await authNotifier.completeSignup(
                phoneNumber: phone.text, 
                code: _otpController.text,
                password: pass.text, 
              );

              if (isVerified && context.mounted) {
                Navigator.pop(ctx); // Dialog'u kapat
                Navigator.pop(context); // Sign Up ekranını kapat
                
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text("Hesabınız oluşturuldu! Giriş yapabilirsiniz."),
                    backgroundColor: Colors.green,
                  ),
                );
              } else {
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
}