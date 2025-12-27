import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_controller.dart';
import '../../globals.dart';

/// Provider to manage the local state of the password reset flow.
final resetPasswordNotifierProvider =
    StateNotifierProvider.autoDispose<
      ResetPasswordNotifier,
      ResetPasswordState
    >((ref) {
      return ResetPasswordNotifier();
    });

/// Screen allowing users to reset their password via Phone (SMS) verification.
class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(resetPasswordNotifierProvider.notifier).reset();
      _otpController.clear();
      _newPasswordController.clear();
      _phoneController.clear();
    });
  }

  /// Validates the phone number and initiates the SMS verification process.
  void _sendSms() {
    FocusScope.of(context).unfocus();
    if (_formKey.currentState!.validate()) {
      String rawPhone = _phoneController.text.trim().replaceAll(' ', '');
      if (rawPhone.startsWith('0')) rawPhone = rawPhone.substring(1);

      final formattedPhone = rawPhone.startsWith('+')
          ? rawPhone
          : '+90$rawPhone';

      ref
          .read(resetPasswordNotifierProvider.notifier)
          .startVerification(formattedPhone);
    }
  }

  /// Verifies the SMS code with Firebase, retrieves the ID Token,
  /// and calls the backend to update the password.
  Future<void> _updatePassword() async {
    // 1. Input Validation
    if (_otpController.text.isEmpty || _newPasswordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Lütfen tüm alanları doldurun.")),
      );
      return;
    }

    final state = ref.read(resetPasswordNotifierProvider);
    final notifier = ref.read(resetPasswordNotifierProvider.notifier);

    try {
      notifier.setLoading(true);

      // 2. Firebase Verification
      // Create a credential using the verification ID (from Step 1) and the SMS code.
      PhoneAuthCredential credential = PhoneAuthProvider.credential(
        verificationId: state.verificationId!,
        smsCode: _otpController.text.trim(),
      );

      // Sign in temporarily to verify the code and get a valid ID Token.
      UserCredential userCredential = await FirebaseAuth.instance
          .signInWithCredential(credential);
      String? idToken = await userCredential.user?.getIdToken();

      // --- CRITICAL STEP ---
      // We sign out immediately after getting the token.
      // This prevents the App Router (listening to AuthState) from detecting a
      // "Logged In" state and prematurely redirecting the user to the Home screen.
      await FirebaseAuth.instance.signOut();

      if (idToken != null) {
        // 3. Backend Request
        // Send the ID Token (proof of phone ownership) and new password to the backend.
        final success = await ref
            .read(authStateProvider.notifier)
            .resetPassword(state.phone!, idToken, _newPasswordController.text);

        if (success) {
          // 4. UI Cleanup
          // Close the dialog if it's still open and the widget is mounted.
          if (mounted && Navigator.canPop(context)) {
            Navigator.of(context).pop();
          }

          // 5. Global Feedback
          // Use 'rootScaffoldMessengerKey' instead of 'context' to show the SnackBar.
          // This ensures the message is visible even if the current screen is disposed
          // or if the router navigates away during the process.
          rootScaffoldMessengerKey.currentState?.showSnackBar(
            const SnackBar(
              content: Text(
                "Şifreniz başarıyla güncellendi! Giriş yapabilirsiniz.",
              ),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 3),
            ),
          );

          // 6. Navigation
          // Wait briefly for the user to read the success message.
          await Future.delayed(const Duration(seconds: 1));

          if (mounted) {
            context.go('/login');
          }
        } else {
          // Handle Backend Error
          rootScaffoldMessengerKey.currentState?.showSnackBar(
            SnackBar(
              content: Text("Hata: ${ref.read(authStateProvider).error}"),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      // Handle Unexpected Errors (Firebase or Network)
      rootScaffoldMessengerKey.currentState?.showSnackBar(
        SnackBar(content: Text("Bir hata oluştu: $e")),
      );
    } finally {
      if (mounted) notifier.setLoading(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(resetPasswordNotifierProvider);

    // Listen for errors or successful verification trigger
    ref.listen(resetPasswordNotifierProvider, (prev, next) {
      if (next.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.error!), backgroundColor: Colors.red),
        );
      }
      if (next.verificationId != null && prev?.verificationId == null) {
        _showResetDialog();
      }
    });

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        appBar: AppBar(title: const Text("Şifre Sıfırlama")),
        body: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(Icons.lock_reset, size: 80, color: Colors.orange),
                  const SizedBox(height: 24),

                  const Text(
                    "Telefon Numaranızı Girin",
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    "Şifrenizi yenilemek için size bir SMS kodu göndereceğiz.",
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 32),

                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Telefon',
                      hintText: '5XX...',
                      prefixText: '+90 ',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.phone),
                    ),
                    validator: (v) =>
                        (v == null || v.isEmpty) ? "Zorunlu alan" : null,
                  ),
                  const SizedBox(height: 24),

                  if (state.isLoading)
                    const Center(child: CircularProgressIndicator())
                  else
                    FilledButton(
                      onPressed: _sendSms,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: const Text("Kod Gönder"),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// Displays the dialog to enter the SMS code and the new password.
  void _showResetDialog() {
    _otpController.clear();
    _newPasswordController.clear();

    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text("Şifre Yenileme"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text("Gelen SMS kodunu ve yeni şifrenizi girin."),
            const SizedBox(height: 16),
            TextField(
              controller: _otpController,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              decoration: const InputDecoration(
                hintText: "SMS Kodu",
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _newPasswordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: "Yeni Şifre",
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              ref.read(resetPasswordNotifierProvider.notifier).reset();
              Navigator.pop(ctx);
            },
            child: const Text("İptal"),
          ),
          Consumer(
            builder: (context, ref, child) {
              final loading = ref
                  .watch(resetPasswordNotifierProvider)
                  .isLoading;
              return loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : ElevatedButton(
                      onPressed: _updatePassword,
                      child: const Text("Güncelle"),
                    );
            },
          ),
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// State Management Classes
// -----------------------------------------------------------------------------

/// Represents the UI state for the password reset screen.
class ResetPasswordState {
  final bool isLoading;
  final String? verificationId;
  final String? error;
  final String? phone;

  ResetPasswordState({
    this.isLoading = false,
    this.verificationId,
    this.error,
    this.phone,
  });

  ResetPasswordState copyWith({
    bool? isLoading,
    String? verificationId,
    String? error,
    String? phone,
  }) {
    return ResetPasswordState(
      isLoading: isLoading ?? this.isLoading,
      verificationId: verificationId ?? this.verificationId,
      error: error,
      phone: phone ?? this.phone,
    );
  }
}

/// Controller managing the Firebase Phone Verification logic.
class ResetPasswordNotifier extends StateNotifier<ResetPasswordState> {
  ResetPasswordNotifier() : super(ResetPasswordState());

  void setLoading(bool val) => state = state.copyWith(isLoading: val);

  /// Resets the state to initial values.
  void reset() => state = ResetPasswordState();

  /// Triggers Firebase Phone Authentication to send an SMS code.
  Future<void> startVerification(String formattedPhone) async {
    state = state.copyWith(isLoading: true, error: null, phone: formattedPhone);
    try {
      await FirebaseAuth.instance.verifyPhoneNumber(
        phoneNumber: formattedPhone,
        verificationCompleted: (_) {
          // Auto-resolution logic (Android only) could be handled here if needed.
        },
        verificationFailed: (e) {
          String msg = e.message ?? "Bir hata oluştu.";
          if (e.code == 'invalid-phone-number')
            msg = "Geçersiz telefon numarası.";
          state = state.copyWith(isLoading: false, error: msg);
        },
        codeSent: (verId, _) =>
            state = state.copyWith(isLoading: false, verificationId: verId),
        codeAutoRetrievalTimeout: (verId) =>
            state = state.copyWith(verificationId: verId),
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}
