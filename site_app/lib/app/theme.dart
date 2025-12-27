import 'package:flutter/material.dart';

/// Defines the global visual styling and color palette for the application.
class AppTheme {
  
  /// The primary brand color used to generate the color scheme.
  static const Color _seedColor = Color(0xFF1E88E5);

  /// Returns the configured light theme data based on Material 3 specifications.
  static ThemeData get light => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: _seedColor),
    
    inputDecorationTheme: const InputDecorationTheme(
      border: OutlineInputBorder(),
    ),
  );
}