import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _phone = TextEditingController();
  final _pass = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);

    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 380),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _form,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Log In', style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 16),
                  
                  // Telefon Alanı
                  TextFormField(
                    controller: _phone,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Phone Number',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.phone),
                    ),
                    validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  
                  // Şifre Alanı
                  TextFormField(
                    controller: _pass,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Password',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.lock),
                    ),
                    validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                  ),

                  // ▼▼▼ ŞİFREMİ UNUTTUM BUTONU BURADA ▼▼▼
                  Align(
                    alignment: Alignment.center,
                    child: TextButton(
                      onPressed: () => _showForgotPasswordSheet(context),
                      child: const Text(
                        'Forgot Password?',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

                  if (auth.error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        auth.error!,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),

                  const SizedBox(height: 12),

                  // Login Butonu
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () async {
                        if (_form.currentState!.validate()) {
                          await ref
                              .read(authStateProvider.notifier)
                              .login(_phone.text.trim(), _pass.text);
                          if (mounted && ref.read(authStateProvider).isLoggedIn) {
                            context.go('/home');
                          }
                        }
                      },
                      child: const Text('Log In'),
                    ),
                  ),
                  
                  // Sign Up Linki
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text("Don't have an account?"),
                      TextButton(
                        onPressed: () => context.push('/signup'),
                        child: const Text('Sign Up'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // --- ŞİFRE SIFIRLAMA PENCERESİ (TELEFON İLE) ---
  void _showForgotPasswordSheet(BuildContext context) {
    final phoneCtrl = TextEditingController(); // Email değil Phone
    final codeCtrl = TextEditingController();
    final newPassCtrl = TextEditingController();
    final confirmPassCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        int step = 0; // 0: Telefon Gir, 1: Kod Gir
        bool isLoading = false;

        return StatefulBuilder(
          builder: (context, setState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
                left: 20,
                right: 20,
                top: 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    step == 0 ? "Şifremi Unuttum" : "Yeni Şifre Belirle",
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),

                  // AŞAMA 0: TELEFON GİRME
                  if (step == 0) ...[
                    const Text("Kayıtlı telefon numaranızı giriniz."),
                    const SizedBox(height: 15),
                    TextField(
                      controller: phoneCtrl,
                      keyboardType: TextInputType.phone, // Klavye Tipi
                      decoration: const InputDecoration(
                        labelText: "Telefon Numarası",
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.phone),
                      ),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: isLoading
                          ? null
                          : () async {
                              if (phoneCtrl.text.isEmpty) return;
                              setState(() => isLoading = true);

                              // Backend İsteği (Artık telefon gönderiyor)
                              final success = await ref
                                  .read(authStateProvider.notifier)
                                  .forgotPassword(phoneCtrl.text.trim());

                              if (context.mounted) {
                                setState(() => isLoading = false);
                                if (success) {
                                  setState(() => step = 1); 
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text("Kod gönderildi (Terminali kontrol et!)")),
                                  );
                                } else {
                                  final err = ref.read(authStateProvider).error;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text(err ?? "Hata")));
                                }
                              }
                            },
                      child: isLoading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Text("Kod Gönder"),
                    ),
                  ],

                  // AŞAMA 1: KOD VE YENİ ŞİFRE
                  if (step == 1) ...[
                    const Text("Telefonunuza gelen kodu ve yeni şifrenizi giriniz."),
                    const SizedBox(height: 15),
                    
                    TextField(
                      controller: codeCtrl,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      decoration: const InputDecoration(
                        labelText: "Gelen Kod",
                        border: OutlineInputBorder(),
                        counterText: "",
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: newPassCtrl,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: "Yeni Şifre",
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.lock_reset),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: confirmPassCtrl,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: "Yeni Şifre (Tekrar)",
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.lock_outline),
                      ),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: isLoading
                          ? null
                          : () async {
                              if (codeCtrl.text.isEmpty ||
                                  newPassCtrl.text.isEmpty ||
                                  confirmPassCtrl.text.isEmpty) return;

                              if (newPassCtrl.text != confirmPassCtrl.text) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text("Şifreler uyuşmuyor!"), backgroundColor: Colors.red)
                                );
                                return;
                              }

                              setState(() => isLoading = true);

                              final success = await ref
                                  .read(authStateProvider.notifier)
                                  .resetPassword(
                                      phoneCtrl.text.trim(), // Telefonu gönderiyoruz
                                      codeCtrl.text, 
                                      newPassCtrl.text
                                  );

                              if (context.mounted) {
                                setState(() => isLoading = false);
                                if (success) {
                                  Navigator.pop(context);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text("Şifre başarıyla güncellendi!"), backgroundColor: Colors.green)
                                  );
                                } else {
                                  final err = ref.read(authStateProvider).error;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text(err ?? "Hata")));
                                }
                              }
                            },
                      child: isLoading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Text("Şifreyi Güncelle"),
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }
}