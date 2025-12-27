import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_controller.dart';

/// Manages the local state of the phone authentication process.
final phoneAuthNotifierProvider =
    StateNotifierProvider<PhoneAuthNotifier, PhoneAuthState>((ref) {
  return PhoneAuthNotifier();
});

/// A multi-step sign-up screen involving Site ID validation,
/// Password creation, and SMS Verification (Firebase).
class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final PageController _pageController = PageController();
  int _currentStep = 0;

  // Form keys for validation
  final _formKeyStep1 = GlobalKey<FormState>();
  final _formKeyStep2 = GlobalKey<FormState>();

  // Input Controllers
  final _phoneController = TextEditingController();
  final _siteIdController = TextEditingController();
  final _passController = TextEditingController();
  final _passConfirmController = TextEditingController();
  final _otpController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    _siteIdController.dispose();
    _passController.dispose();
    _passConfirmController.dispose();
    _otpController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    // Reset the provider state when entering the screen to ensure a clean slate.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(phoneAuthNotifierProvider.notifier).reset();
    });
  }

  /// Validates Step 1 and moves to the Password creation step.
  void _nextStep() {
    // Dismiss keyboard
    FocusScope.of(context).unfocus();

    if (_formKeyStep1.currentState!.validate()) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      setState(() => _currentStep = 1);
    }
  }

  /// Moves back to Step 1.
  void _prevStep() {
    FocusScope.of(context).unfocus();
    _pageController.previousPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
    setState(() => _currentStep = 0);
  }

  /// Formats the phone number and initiates Firebase Phone Auth.
  void _startPhoneAuth() {
    FocusScope.of(context).unfocus();

    String rawPhone = _phoneController.text.trim().replaceAll(' ', '');
    if (rawPhone.startsWith('0')) rawPhone = rawPhone.substring(1);
    
    // Ensure E.164 format for Turkey (+90)
    String formattedPhone = rawPhone.startsWith('+')
        ? rawPhone
        : '+90$rawPhone';

    ref.read(phoneAuthNotifierProvider.notifier).startVerification(
          phoneNumber: formattedPhone,
          password: _passController.text,
        );
  }

  /// Verifies the entered OTP and registers the user in the backend.
  Future<void> _verifyOtpAndRegister() async {
    final state = ref.read(phoneAuthNotifierProvider);
    
    if (_otpController.text.isEmpty || state.verificationId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Lütfen kodu giriniz.")),
      );
      return;
    }

    try {
      ref.read(phoneAuthNotifierProvider.notifier).setLoading(true);

      // 1. Create credential from OTP
      PhoneAuthCredential credential = PhoneAuthProvider.credential(
        verificationId: state.verificationId!,
        smsCode: _otpController.text.trim(),
      );

      // 2. Sign in to Firebase to get the ID Token
      UserCredential userCredential = await FirebaseAuth.instance
          .signInWithCredential(credential);
      
      String? idToken = await userCredential.user?.getIdToken();

      if (idToken != null) {
        await _finishSignupProcess(idToken: idToken);
      }
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        ref.read(phoneAuthNotifierProvider.notifier).setLoading(false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Doğrulama Hatası: ${e.message}")),
        );
      }
    } catch (e) {
      if (mounted) {
        ref.read(phoneAuthNotifierProvider.notifier).setLoading(false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Hata: $e")),
        );
      }
    }
  }

  /// Calls the backend to finalize the user registration.
  Future<void> _finishSignupProcess({required String idToken}) async {
    final state = ref.read(phoneAuthNotifierProvider);

    if (state.savedPhone == null || state.savedPassword == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Oturum zaman aşımı. Lütfen tekrar deneyin.")),
      );
      return;
    }

    // Call the main Auth Controller
    final authNotifier = ref.read(authStateProvider.notifier);

    final success = await authNotifier.completeSignup(
      phoneNumber: state.savedPhone!,
      code: idToken, // In this flow, ID Token acts as proof of verification
      password: state.savedPassword!,
    );

    if (mounted) {
      ref.read(phoneAuthNotifierProvider.notifier).setLoading(false);
    }

    if (success && mounted) {
      ref.read(phoneAuthNotifierProvider.notifier).reset();

      // Close dialog if open
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      }

      context.go('/login');

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Hesabınız başarıyla oluşturuldu! Giriş yapabilirsiniz."),
          backgroundColor: Colors.green,
        ),
      );
    } else if (mounted) {
      final errorMsg = ref.read(authStateProvider).error ?? "Kayıt başarısız.";
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(errorMsg), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final phoneState = ref.watch(phoneAuthNotifierProvider);

    // Listen to state changes to trigger UI events (Dialogs, Snackbars)
    ref.listen(phoneAuthNotifierProvider, (previous, next) {
      if (next.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.error!), backgroundColor: Colors.red),
        );
        ref.read(phoneAuthNotifierProvider.notifier).clearError();
      }

      // Show OTP dialog when verification ID is received
      if (next.verificationId != null && previous?.verificationId == null) {
        _showOtpDialog();
      }

      // Handle auto-verification (Android specific)
      if (next.autoVerifiedToken != null && previous?.autoVerifiedToken == null) {
        _finishSignupProcess(idToken: next.autoVerifiedToken!);
      }
    });

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        appBar: AppBar(
          title: Text(_currentStep == 0 ? 'Hesap Oluştur' : 'Şifre Belirle'),
          centerTitle: true,
          leading: _currentStep == 1
              ? IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: _prevStep,
                )
              : IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => context.pop(),
                ),
        ),
        body: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // Animated Progress Indicator
              TweenAnimationBuilder<double>(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
                tween: Tween<double>(begin: 0, end: (_currentStep + 1) / 2),
                builder: (context, value, _) {
                  return LinearProgressIndicator(
                    value: value,
                    minHeight: 6,
                    borderRadius: BorderRadius.circular(10),
                  );
                },
              ),

              const SizedBox(height: 24),

              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  onPageChanged: (index) {
                    setState(() {
                      _currentStep = index;
                    });
                  },
                  children: [_buildStep1(), _buildStep2(phoneState.isLoading)],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Step 1: Site ID and Phone Number Input
  Widget _buildStep1() {
    return Form(
      key: _formKeyStep1,
      child: ListView(
        children: [
          const Text(
            "Lütfen site kodunuzu ve telefon numaranızı giriniz.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16),
          ),
          const SizedBox(height: 30),
          
          TextFormField(
            controller: _siteIdController,
            decoration: const InputDecoration(
              labelText: 'Site ID',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.business),
              hintText: "Örn: VN58FN",
            ),
            validator: (v) => (v == null || v.isEmpty) ? 'Zorunlu alan' : null,
          ),
          const SizedBox(height: 16),
          
          TextFormField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Telefon Numarası',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.phone),
              hintText: "5XX...",
              prefixText: "+90 ",
            ),
            validator: (v) => (v == null || v.isEmpty) ? 'Zorunlu alan' : null,
          ),
          const SizedBox(height: 32),
          
          FilledButton(
            onPressed: _nextStep,
            style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
            child: const Text('Devam Et'),
          ),
        ],
      ),
    );
  }

  /// Step 2: Password Creation
  Widget _buildStep2(bool isLoading) {
    return Form(
      key: _formKeyStep2,
      child: ListView(
        children: [
          const Text(
            "Hesabınız için güvenli bir şifre belirleyin.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16),
          ),
          const SizedBox(height: 30),
          
          TextFormField(
            controller: _passController,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: 'Şifre',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.lock_outline),
            ),
            validator: (v) =>
                (v == null || v.length < 6) ? 'En az 6 karakter olmalı' : null,
          ),
          const SizedBox(height: 16),
          
          TextFormField(
            controller: _passConfirmController,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: 'Şifreyi Onayla',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.lock),
            ),
            validator: (v) => (v != _passController.text) ? 'Şifreler uyuşmuyor' : null,
          ),
          const SizedBox(height: 32),
          
          if (isLoading)
            const Center(child: CircularProgressIndicator())
          else
            FilledButton(
              onPressed: () {
                if (_formKeyStep2.currentState!.validate()) {
                  _startPhoneAuth();
                }
              },
              style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              child: const Text('Kaydı Tamamla'),
            ),
        ],
      ),
    );
  }

  void _showOtpDialog() {
    _otpController.clear();
    
    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text("Telefon Doğrulama"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text("Telefonunuza gelen doğrulama kodunu giriniz:"),
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
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              ref.read(phoneAuthNotifierProvider.notifier).reset();
              Navigator.pop(ctx);
            },
            child: const Text("İptal"),
          ),
          Consumer(
            builder: (context, ref, child) {
              final loading = ref.watch(phoneAuthNotifierProvider).isLoading;
              return loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : ElevatedButton(
                      onPressed: _verifyOtpAndRegister,
                      child: const Text("Onayla"),
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

/// State object representing the UI state of the phone authentication flow.
class PhoneAuthState {
  final bool isLoading;
  final String? verificationId;
  final String? error;
  final String? autoVerifiedToken;
  final String? savedPhone;
  final String? savedPassword;

  PhoneAuthState({
    this.isLoading = false,
    this.verificationId,
    this.error,
    this.autoVerifiedToken,
    this.savedPhone,
    this.savedPassword,
  });

  PhoneAuthState copyWith({
    bool? isLoading,
    String? verificationId,
    String? error,
    String? autoVerifiedToken,
    String? savedPhone,
    String? savedPassword,
  }) {
    return PhoneAuthState(
      isLoading: isLoading ?? this.isLoading,
      verificationId: verificationId ?? this.verificationId,
      error: error,
      autoVerifiedToken: autoVerifiedToken ?? this.autoVerifiedToken,
      savedPhone: savedPhone ?? this.savedPhone,
      savedPassword: savedPassword ?? this.savedPassword,
    );
  }
}

/// Controller managing the Firebase Phone Verification logic for Sign Up.
class PhoneAuthNotifier extends StateNotifier<PhoneAuthState> {
  PhoneAuthNotifier() : super(PhoneAuthState());

  void setLoading(bool val) => state = state.copyWith(isLoading: val);
  void clearError() => state = state.copyWith(error: null);
  void reset() => state = PhoneAuthState();

  Future<void> startVerification({
    required String phoneNumber,
    required String password,
  }) async {
    state = state.copyWith(
      isLoading: true,
      error: null,
      savedPhone: phoneNumber,
      savedPassword: password,
    );

    try {
      await FirebaseAuth.instance.verifyPhoneNumber(
        phoneNumber: phoneNumber,

        // Android automatic verification
        verificationCompleted: (PhoneAuthCredential credential) async {
          // Sign in to get the token, then update state
          final userCred = await FirebaseAuth.instance.signInWithCredential(credential);
          String? token = await userCred.user?.getIdToken();
          state = state.copyWith(isLoading: false, autoVerifiedToken: token);
        },

        verificationFailed: (FirebaseAuthException e) {
          String msg = e.message ?? "Doğrulama hatası.";
          if (e.code == 'invalid-phone-number') msg = "Geçersiz telefon numarası.";
          state = state.copyWith(isLoading: false, error: msg);
        },

        codeSent: (String verificationId, int? resendToken) {
          state = state.copyWith(
            isLoading: false,
            verificationId: verificationId,
          );
        },

        codeAutoRetrievalTimeout: (String verificationId) {
          state = state.copyWith(verificationId: verificationId);
        },
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: "Beklenmeyen hata: $e");
    }
  }
}