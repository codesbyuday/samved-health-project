import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  static const String defaultLocalhost = 'http://localhost:8000';
  static const String defaultLoopbackIp = 'http://127.0.0.1:8000';
  static const String defaultAndroidEmulator = 'http://10.0.2.2:8000';
  static const String defaultHostLanIp = 'http://172.22.180.106:8000';
  
  static const String prefBaseUrlKey = 'custom_api_base_url';

  /// Resolves the default backend base URL depending on platform
  static String get defaultBaseUrl {
    if (kIsWeb) {
      return defaultLocalhost;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        // On physical devices, 127.0.0.1 works via `adb reverse tcp:8000 tcp:8000`
        // On emulators, 10.0.2.2 routes to the host machine.
        return defaultLoopbackIp;
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
      case TargetPlatform.windows:
      case TargetPlatform.linux:
      default:
        return defaultLocalhost;
    }
  }

  /// Retrieves the active API base URL (customized via settings or platform default)
  static Future<String> getBaseUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final customUrl = prefs.getString(prefBaseUrlKey);
      if (customUrl != null && customUrl.trim().isNotEmpty) {
        return customUrl.trim().replaceAll(RegExp(r'/+$'), '');
      }
    } catch (_) {}
    return defaultBaseUrl;
  }

  /// Sets a custom API base URL for physical device or network testing
  static Future<void> setCustomBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(prefBaseUrlKey, url.trim().replaceAll(RegExp(r'/+$'), ''));
  }

  /// Tests connectivity to the FastAPI backend
  static Future<Map<String, dynamic>> testConnection([String? testUrl]) async {
    final targetUrl = (testUrl != null && testUrl.trim().isNotEmpty)
        ? testUrl.trim().replaceAll(RegExp(r'/+$'), '')
        : await getBaseUrl();

    try {
      final uri = Uri.parse('$targetUrl/docs');
      final response = await http.get(uri).timeout(const Duration(seconds: 4));
      if (response.statusCode >= 200 && response.statusCode < 400) {
        return {
          'success': true,
          'message': 'Connected to FastAPI (HTTP ${response.statusCode})',
          'url': targetUrl,
        };
      } else {
        return {
          'success': false,
          'message': 'Server responded with HTTP ${response.statusCode}',
          'url': targetUrl,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection failed: $e',
        'url': targetUrl,
      };
    }
  }

  // ==========================================
  // REST API v1 Endpoint Paths
  // ==========================================
  static const String apiPrefix = '/api/v1';

  // Auth
  static const String authLogin = '$apiPrefix/auth/login';
  static const String authRegister = '$apiPrefix/auth/register';
  static const String authMe = '$apiPrefix/auth/me';

  // Citizens & Health Cards
  static const String citizens = '$apiPrefix/citizens';
  static const String citizenSearch = '$apiPrefix/citizens/search';
  static const String healthCards = '$apiPrefix/health-cards';
  static String citizenHealthRecords(String citizenId) => '$apiPrefix/citizens/$citizenId/health-records';
  static String citizenVaccinations(String citizenId) => '$apiPrefix/citizens/$citizenId/vaccinations';
  static String citizenComplaints(String citizenId) => '$apiPrefix/citizens/$citizenId/complaints';

  // Hospitals & Doctors
  static const String hospitals = '$apiPrefix/hospitals';
  static const String hospitalDepartments = '$apiPrefix/hospitals/departments';
  static const String hospitalDoctors = '$apiPrefix/hospitals/doctors';

  // Appointments
  static const String appointments = '$apiPrefix/appointments';

  // Laboratories
  static const String labReports = '$apiPrefix/laboratories/reports';
  static const String labTestTypes = '$apiPrefix/laboratories/test-types';

  // Pharmacies & Medicines
  static const String medicines = '$apiPrefix/pharmacies/medicines';
  static const String pharmacyStock = '$apiPrefix/pharmacies/stock';

  // Disease Surveillance & SMC
  static const String publicAnalytics = '$apiPrefix/disease-surveillance/public-analytics';
  static const String smcAlerts = '$apiPrefix/smc/alerts';
  static const String smcWards = '$apiPrefix/smc/wards';
  static const String smcCampaigns = '$apiPrefix/smc/campaigns';
  static const String smcComplaints = '$apiPrefix/smc/complaints';

  // Notifications
  static const String notifications = '$apiPrefix/notifications';

  // Payments
  static const String paymentsInitiate = '$apiPrefix/payments/initiate';
}
