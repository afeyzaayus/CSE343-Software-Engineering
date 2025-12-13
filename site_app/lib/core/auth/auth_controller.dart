import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../network/dio_provider.dart';
import '../result.dart';
import 'auth_repository.dart';

/// ---- STATE ----
class AuthState {
  final bool isLoggedIn;
  final bool isLoading;
  final User? user;
  final String? error;

  const AuthState({
    required this.isLoggedIn,
    this.isLoading = false,
    this.user,
    this.error,
  });

  AuthState copyWith({
    bool? isLoggedIn,
    bool? isLoading,
    User? user,
    String? error,
  }) =>
      AuthState(
        isLoggedIn: isLoggedIn ?? this.isLoggedIn,
        isLoading: isLoading ?? this.isLoading,
        user: user ?? this.user,
        error: error,
      );

  static const empty = AuthState(isLoggedIn: false, isLoading: false);
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

  /// Login İşlemi
  Future<void> login(String phoneNumber, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    final repo = _ref.read(authRepositoryProvider);
    final res = await repo.login(phoneNumber, password);

    switch (res) {
      case Ok(data: final v):
        state = AuthState(isLoggedIn: true, isLoading: false, user: v.$3);
      case Err(message: final m):
        state = state.copyWith(isLoading: false, error: m);
    }
  }

  /// ADIM 1: Kayıt Başlatma (Sadece Telefon + SiteID)
  Future<bool> initiateSignup({
    required String phoneNumber,
    required String siteId,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    final repo = _ref.read(authRepositoryProvider);

    final r = await repo.initiateSignup(
      phoneNumber: phoneNumber,
      siteId: siteId,
    );

    switch (r) {
      case Ok():
        state = state.copyWith(isLoading: false);
        return true; 
      case Err(message: final m):
        state = state.copyWith(isLoading: false, error: m);
        return false;
    }
  }

  /// ADIM 2: Kayıt Tamamlama (Telefon + Kod + Şifre)
  Future<bool> completeSignup({
    required String phoneNumber,
    required String code,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    final repo = _ref.read(authRepositoryProvider);

    final result = await repo.completeSignup(
      phoneNumber: phoneNumber, 
      code: code,
      password: password
    );

    switch (result) {
      case Ok():
        state = state.copyWith(isLoading: false);
        return true;
      case Err(message: final m):
        state = state.copyWith(isLoading: false, error: m);
        return false;
    }
  }

  /// Şifremi Unuttum (SMS Gönder)
  Future<bool> forgotPassword(String phoneNumber) async {
    state = state.copyWith(isLoading: true, error: null);
    final r = await _ref.read(authRepositoryProvider).forgotPassword(phoneNumber);
    
    state = state.copyWith(isLoading: false);

    if (r is Err) {
      state = state.copyWith(error: r.message);
      return false;
    }
    return true;
  }

  /// Şifre Sıfırlama (SMS Kodu ile yeni şifre belirle)
  Future<bool> resetPassword(String phoneNumber, String code, String newPass) async {
    state = state.copyWith(isLoading: true, error: null);
    final r = await _ref.read(authRepositoryProvider).resetPassword(phoneNumber, code, newPass);
    
    state = state.copyWith(isLoading: false);

    if (r is Err) {
      state = state.copyWith(error: r.message);
      return false;
    }
    return true;
  }

  /// Çıkış Yap
  Future<void> logout() async {
    await _ref.read(authRepositoryProvider).logout();
    state = AuthState.empty;
  }
}