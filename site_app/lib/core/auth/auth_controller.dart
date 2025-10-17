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

  const AuthState({
    required this.isLoggedIn,
    this.user,
    this.error,
  });

  AuthState copyWith({
    bool? isLoggedIn,
    User? user,
    String? error,
  }) =>
      AuthState(
        isLoggedIn: isLoggedIn ?? this.isLoggedIn,
        user: user ?? this.user,
        error: error,
      );

  static const empty = AuthState(isLoggedIn: false);
}

/// ---- PROVIDERS ----
final authRepositoryProvider =
    Provider<AuthRepository>((ref) => AuthRepository(ref.read(dioProvider)));

final authStateProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref);
});

/// ---- CONTROLLER ----
class AuthController extends StateNotifier<AuthState> {
  AuthController(this._ref) : super(AuthState.empty);
  final Ref _ref;

  /// POST /api/auth/user/login  + GET /api/users/{userId}
  Future<void> login(String email, String password) async {
    state = state.copyWith(error: null);

    final repo = _ref.read(authRepositoryProvider);
    final res = await repo.login(email, password);

    switch (res) {
      case Ok(data: final v): // v = (accessToken, refreshToken, me)
        state = AuthState(isLoggedIn: true, user: v.$3);
      case Err(message: final m):
        state = state.copyWith(error: m);
    }
  }

  /// POST /api/auth/user/register
  Future<void> signup({
    required String name,
    required String surname,
    required String email,
    required String password,
    required String siteCode,
  }) async {
    state = state.copyWith(error: null);

    final repo = _ref.read(authRepositoryProvider);
    final r = await repo.signup(
      name: name,
      surname: surname,
      email: email,
      password: password,
      siteCode: siteCode,
    );

    switch (r) {
      case Ok():
        // Başarılı – UI tarafında Navigator.pop ile Login'e dönüyorsun.
        break;
      case Err(message: final m):
        state = state.copyWith(error: m);
    }
  }

  Future<void> logout() async {
    await _ref.read(authRepositoryProvider).logout();
    state = AuthState.empty;
  }
}
