import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import 'api_client.dart';

class AuthResult {
  final bool success;
  final String? message;
  final String? userId;
  final String? citizenId;
  final String? token;
  final Map<String, dynamic>? userData;

  AuthResult({
    required this.success,
    this.message,
    this.userId,
    this.citizenId,
    this.token,
    this.userData,
  });
}

class AuthService {
  static const String prefUserIdKey = 'user_id';
  static const String prefCitizenIdKey = 'citizen_id';
  static const String prefUserPhoneKey = 'user_phone';
  static const String prefTokenKey = 'auth_token';

  /// Login citizen using phone number and password
  static Future<AuthResult> login({
    required String phone,
    required String password,
  }) async {
    final cleanPhone = phone.trim();
    final cleanPassword = password.trim();
    final baseUrl = await ApiConfig.getBaseUrl();

    // 1. Send authentication request to FastAPI backend
    try {
      final response = await ApiClient.post<Map<String, dynamic>>(
        ApiConfig.authLogin,
        body: {
          'identifier': cleanPhone,
          'email': cleanPhone,
          'phone': cleanPhone,
          'password': cleanPassword,
        },
      );

      if (response.isSuccess && response.data != null) {
        final data = response.data!;

        // Validate backend logical success
        if (data['success'] == false) {
          return AuthResult(
            success: false,
            message: data['error']?.toString() ?? 'Invalid phone number or password.',
          );
        }

        final token = data['token']?.toString() ?? data['access_token']?.toString();
        final user = data['user'] is Map<String, dynamic> ? data['user'] as Map<String, dynamic> : data;
        final userId = (user['user_id'] ?? user['id'] ?? '').toString();
        final citizenId = (user['citizen_id'] ?? data['citizen_id'] ?? '').toString();

        if (userId.isEmpty) {
          return AuthResult(
            success: false,
            message: 'Authentication failed: no user ID returned by server.',
          );
        }

        await _saveSession(
          token: token,
          userId: userId,
          citizenId: citizenId.isNotEmpty ? citizenId : null,
          phone: cleanPhone,
        );

        return AuthResult(
          success: true,
          userId: userId,
          citizenId: citizenId.isNotEmpty ? citizenId : null,
          token: token,
          userData: user,
        );
      }

      // Return exact FastAPI error (e.g. 401 Unauthorized or 422 Validation Error)
      return AuthResult(
        success: false,
        message: response.errorMessage ?? 'Invalid phone number or password.',
      );
    } catch (e) {
      debugPrint('FastAPI login exception: $e');
      return AuthResult(
        success: false,
        message: 'Could not connect to FastAPI server at $baseUrl.\nError: $e\n\nTip: For physical USB Android device, run "adb reverse tcp:8000 tcp:8000" or configure your PC Wi-Fi IP.',
      );
    }
  }

  /// Register citizen account
  static Future<AuthResult> register({
    required String phone,
    required String password,
    required String name,
    int? wardNumber,
    String? aadharId,
    String? bloodGroup,
    String? dateOfBirth,
    String? gender,
    String? address,
  }) async {
    final cleanPhone = phone.trim();
    final baseUrl = await ApiConfig.getBaseUrl();

    // 1. Send registration request to FastAPI backend
    try {
      final response = await ApiClient.post<Map<String, dynamic>>(
        ApiConfig.authRegister,
        body: {
          'phone': cleanPhone,
          'password': password.trim(),
          'name': name.trim(),
          'role': 'citizen',
          'ward_number': wardNumber,
          'aadhar_id': aadharId,
          'blood_group': bloodGroup,
          'date_of_birth': dateOfBirth,
          'gender': gender,
          'address': address,
        },
      );

      if (response.isSuccess && response.data != null) {
        final data = response.data!;
        final token = data['access_token']?.toString();
        final userId = (data['user_id'] ?? data['id'] ?? '').toString();
        final citizenId = data['citizen_id']?.toString();

        await _saveSession(
          token: token,
          userId: userId,
          citizenId: citizenId,
          phone: cleanPhone,
        );

        return AuthResult(
          success: true,
          userId: userId,
          citizenId: citizenId,
          token: token,
          userData: data,
        );
      }

      return AuthResult(
        success: false,
        message: response.errorMessage ?? 'Registration failed on backend.',
      );
    } catch (e) {
      debugPrint('FastAPI register exception: $e');
      return AuthResult(
        success: false,
        message: 'Could not connect to FastAPI server at $baseUrl: $e',
      );
    }
  }

  /// Saves session credentials in SharedPreferences
  static Future<void> _saveSession({
    String? token,
    required String userId,
    String? citizenId,
    String? phone,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    // 1. Clear previous session state completely
    await prefs.remove(prefTokenKey);
    await prefs.remove(prefUserIdKey);
    await prefs.remove(prefCitizenIdKey);
    await prefs.remove(prefUserPhoneKey);

    // 2. Store newly authenticated user identity
    if (token != null && token.isNotEmpty) await prefs.setString(prefTokenKey, token);
    await prefs.setString(prefUserIdKey, userId);
    if (phone != null && phone.isNotEmpty) await prefs.setString(prefUserPhoneKey, phone);

    // 3. Set citizen_id specifically for this user
    if (citizenId != null && citizenId.isNotEmpty) {
      await prefs.setString(prefCitizenIdKey, citizenId);
    }
  }

  /// Retrieves current logged-in user ID
  static Future<String?> getCurrentUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(prefUserIdKey);
  }

  /// Retrieves current citizen ID
  static Future<String?> getCurrentCitizenId() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString(prefUserIdKey);
    if (userId == null || userId.isEmpty) return null;

    final cached = prefs.getString(prefCitizenIdKey);
    if (cached != null && cached.isNotEmpty) return cached;

    return null;
  }

  /// Logout
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(prefTokenKey);
    await prefs.remove(prefUserIdKey);
    await prefs.remove(prefCitizenIdKey);
    await prefs.remove(prefUserPhoneKey);
  }
}
