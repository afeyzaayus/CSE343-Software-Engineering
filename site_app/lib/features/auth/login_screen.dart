import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_controller.dart';

/// The screen allowing existing users to sign in to the application.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  /// Handles the login process: validation, formatting, and API call.
  Future<void> _onLogin() async {
    // Close the keyboard
    FocusScope.of(context).unfocus();

    if (_formKey.currentState!.validate()) {
      // 1. Format the phone number to E.164 standard (e.g., +905551234567)
      String rawPhone = _phoneController.text.trim().replaceAll(' ', '');

      if (rawPhone.startsWith('0')) {
        rawPhone = rawPhone.substring(1);
      }

      // Check if user already added +90 or similar code, otherwise default to TR (+90)
      String formattedPhone = rawPhone.startsWith('+')
          ? rawPhone
          : '+90$rawPhone';

      // 2. Attempt login via Riverpod controller
      final success = await ref
          .read(authStateProvider.notifier)
          .login(phone: formattedPhone, password: _passwordController.text);

      // 3. Handle navigation or error feedback
      if (mounted) {
        if (success) {
          context.go('/home');
        } else {
          final errorMsg =
              ref.read(authStateProvider).error ?? 'Bilinmeyen hata oluştu.';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("Giriş Başarısız: $errorMsg"),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authStateProvider).isLoading;

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        body: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(
                    Icons.lock_person_outlined,
                    size: 80,
                    color: Colors.blue,
                  ),
                  const SizedBox(height: 24),

                  const Text(
                    "Hoş Geldiniz",
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    "Devam etmek için giriş yapın",
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 32),

                  // Phone Input
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Telefon Numarası',
                      hintText: '5XX...',
                      prefixIcon: Icon(Icons.phone),
                      border: OutlineInputBorder(),
                      prefixText: '+90 ',
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Lütfen telefon numaranızı girin';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Password Input
                  TextFormField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Şifre',
                      prefixIcon: Icon(Icons.lock_outline),
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Lütfen şifrenizi girin';
                      }
                      return null;
                    },
                  ),

                  // Forgot Password Link
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () {
                        context.push('/forgot-password');
                      },
                      child: const Text("Şifremi Unuttum?"),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Login Button
                  if (isLoading)
                    const Center(child: CircularProgressIndicator())
                  else
                    FilledButton(
                      onPressed: _onLogin,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        textStyle: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      child: const Text("Giriş Yap"),
                    ),

                  const SizedBox(height: 24),

                  // Signup Link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text("Hesabınız yok mu?"),
                      TextButton(
                        onPressed: () {
                          context.push('/signup');
                        },
                        child: const Text("Kayıt Ol"),
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
}
