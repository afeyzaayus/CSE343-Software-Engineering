import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../network/dio_provider.dart';
import '../result.dart';
import 'auth_repository.dart';

/// ---- STATE ----
class AuthState {
  final bool isLoggedIn;
  final User? user;
  final String? error;

  const AuthState({required this.isLoggedIn, this.user, this.error});

  AuthState copyWith({bool? isLoggedIn, User? user, String? error}) =>
      AuthState(
        isLoggedIn: isLoggedIn ?? this.isLoggedIn,
        user: user ?? this.user,
        error: error,
      );

  static const empty = AuthState(isLoggedIn: false);
}

/// ---- PROVIDERS ----
final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.read(dioProvider)),
);

final authStateProvider = StateNotifierProvider<AuthController, AuthState>((
  ref,
) {
  return AuthController(ref);
});

/// ---- CONTROLLER ----
class AuthController extends StateNotifier<AuthState> {
  AuthController(this._ref) : super(AuthState.empty);
  final Ref _ref;

  /// POST /api/auth/user/login  + GET /api/users/{userId}
 Future<void> login(String phoneNumber, String password) async { // email yerine phoneNumber
    state = state.copyWith(error: null);

    final repo = _ref.read(authRepositoryProvider);
    
    // Repository'i yeni parametreyle çağır
    final res = await repo.login(phoneNumber, password); 

    switch (res) {
      case Ok(data: final v): 
        state = AuthState(isLoggedIn: true, user: v.$3);
      case Err(message: final m):
        state = state.copyWith(error: m);
    }
  }

  /// POST /api/auth/user/register
  /// Geriye bool döner: True ise SMS gönderildi (Dialog aç), False ise hata var.
  Future<bool> signup({
    required String fullName,
    required String phoneNumber,
    required String email,
    required String password,
    required String siteId,
    String? blockNo,
    String? apartmentNo,
  }) async {
    //state = state.copyWith(error: null); // Hata durumunu sıfırla

    final repo = _ref.read(authRepositoryProvider);

    final r = await repo.signup(
      fullName: fullName,
      phoneNumber: phoneNumber,
      email: email,
      password: password,
      siteId: siteId,
      blockNo: blockNo,
      apartmentNo: apartmentNo,
    );

    switch (r) {
      case Ok():
        return true; // Başarılı, UI dialog açabilir
      case Err(message: final m):
        state = state.copyWith(error: m);
        return false; // Başarısız
    }
  }

  /// OTP Doğrulama Metodu
  Future<bool> verifyOtp(String phoneNumber, String code) async {
    state = state.copyWith(error: null);
    final repo = _ref.read(authRepositoryProvider);

    final result = await repo.verifyOtp(phoneNumber: phoneNumber, code: code);

    switch (result) {
      case Ok():
        // Doğrulama başarılı ise, dilersen burada otomatik login de yaptırabilirsin.
        return true;
      case Err(message: final m):
        state = state.copyWith(error: m);
        return false;
    }
  }

  Future<void> logout() async {
    await _ref.read(authRepositoryProvider).logout();
    state = AuthState.empty;
  }

  Future<bool> forgotPassword(String email) async {
    state = state.copyWith(error: null);
    final r = await _ref.read(authRepositoryProvider).forgotPassword(email);
    if (r is Err) {
      state = state.copyWith(error: r.message);
      return false;
    }
    return true;
  }

  Future<bool> resetPassword(String email, String code, String newPass) async {
    state = state.copyWith(error: null);
    final r = await _ref.read(authRepositoryProvider).resetPassword(email, code, newPass);
    if (r is Err) {
      state = state.copyWith(error: r.message);
      return false;
    }
    return true;
  }
}
