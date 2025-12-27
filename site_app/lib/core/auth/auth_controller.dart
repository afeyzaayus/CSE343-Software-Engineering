import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../network/dio_provider.dart';
import '../result.dart';
import 'auth_repository.dart';

/// Represents the current authentication state of the user.
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
  }) => AuthState(
    isLoggedIn: isLoggedIn ?? this.isLoggedIn,
    isLoading: isLoading ?? this.isLoading,
    user: user ?? this.user,
    error: error,
  );

  static const empty = AuthState(isLoggedIn: false, isLoading: false);
}

/// Provides access to the [AuthRepository].
final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.read(dioProvider)),
);

/// Manages the state and business logic for authentication.
final authStateProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref);
});

/// Controller responsible for handling login, signup, and password recovery flows.
class AuthController extends StateNotifier<AuthState> {
  AuthController(this._ref) : super(AuthState.empty);
  final Ref _ref;

  /// Authenticates the user with phone and password.
  Future<bool> login({required String phone, required String password}) async {
    state = state.copyWith(isLoading: true, error: null);

    final repo = _ref.read(authRepositoryProvider);
    final res = await repo.login(phone, password);

    switch (res) {
      case Ok(data: final v):
        // Assuming the user object is the 3rd element in the tuple/record
        state = AuthState(isLoggedIn: true, isLoading: false, user: v.$3);
        return true;

      case Err(message: final m):
        state = state.copyWith(isLoading: false, error: m);
        return false;
    }
  }

  /// Initiates the signup process (e.g., sends verification code).
  Future<bool> initiateSignup({
    required String phoneNumber,
    required String siteId,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    final repo = _ref.read(authRepositoryProvider);
    final res = await repo.initiateSignup(
      phoneNumber: phoneNumber,
      siteId: siteId,
    );

    switch (res) {
      case Ok():
        state = state.copyWith(isLoading: false);
        return true;

      case Err(message: final m):
        state = state.copyWith(isLoading: false, error: m);
        return false;
    }
  }

  /// Completes the signup process by verifying the code and setting a password.
  Future<bool> completeSignup({
    required String phoneNumber,
    required String code,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    final repo = _ref.read(authRepositoryProvider);
    final res = await repo.completeSignup(
      phoneNumber: phoneNumber,
      code: code,
      password: password,
    );

    switch (res) {
      case Ok():
        state = state.copyWith(isLoading: false);
        return true;

      case Err(message: final m):
        state = state.copyWith(isLoading: false, error: m);
        return false;
    }
  }

  /// Requests a password reset (e.g., sends an SMS).
  Future<bool> forgotPassword(String phoneNumber) async {
    state = state.copyWith(isLoading: true, error: null);

    final repo = _ref.read(authRepositoryProvider);
    final res = await repo.forgotPassword(phoneNumber);

    state = state.copyWith(isLoading: false);

    if (res is Err) {
      state = state.copyWith(error: res.message);
      return false;
    }
    return true;
  }

  /// Resets the user's password using the provided token.
  Future<bool> resetPassword(
    String phoneNumber,
    String idToken,
    String newPass,
  ) async {
    state = state.copyWith(isLoading: true, error: null);

    final repo = _ref.read(authRepositoryProvider);
    final res = await repo.resetPassword(phoneNumber, idToken, newPass);

    state = state.copyWith(isLoading: false);

    if (res is Err) {
      state = state.copyWith(error: res.message);
      return false;
    }
    return true;
  }

  /// Logs out the current user and clears the state.
  Future<void> logout() async {
    try {
      await _ref.read(authRepositoryProvider).logout();
    } catch (_) {
      // Ignore errors during logout, just clear local state.
    }
    state = AuthState.empty;
  }
}