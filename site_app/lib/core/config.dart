/// Global configuration settings for the application.
class AppConfig {
  /// Flag to toggle between mock data and real API endpoints.
  /// Set to [false] for production.
  static const bool useMockApi = false;

  /// The base URL for the backend API.
  static const String apiBaseUrl = 'http://164.90.178.202:3000';
}