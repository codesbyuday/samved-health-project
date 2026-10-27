import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  /// Live deployed backend URL on Vercel
  static const String liveProductionUrl = 'https://backend-wine-two-70.vercel.app';
  static const String defaultLocalhost = 'http://localhost:8000';
  static const String defaultLoopbackIp = 'http://127.0.0.1:8000';
  static const String defaultAndroidEmulator = 'http://10.0.2.2:8000';
  static const String defaultHostLanIp = 'http://10.96.78.137:8000';
  
  static const String prefBaseUrlKey = 'custom_api_base_url';

  /// Resolves the default backend base URL pointing to the live deployed Vercel backend
  static String get defaultBaseUrl => liveProductionUrl;

  /// Retrieves the active API base URL (customized via settings or live deployed default)
  static Future<String> getBaseUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final customUrl = prefs.getString(prefBaseUrlKey);
      if (customUrl != null && customUrl.trim().isNotEmpty) {
        final clean = customUrl.trim().replaceAll(RegExp(r'/+$'), '');
        // If the saved custom URL is an old local development URL, automatically use live deployed backend
        final isOldLocal = clean.contains('localhost') ||
            clean.contains('127.0.0.1') ||
            clean.contains('10.0.2.2') ||
            clean.contains('10.96.78.137') ||
            clean.contains('172.22.180.106');
        if (!isOldLocal) {
          return clean;
        }
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
      final response = await http.get(uri).timeout(const Duration(seconds: 10));
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
  static const String laboratories = '$apiPrefix/laboratories';
  static const String labSearchTests = '$apiPrefix/laboratories/search-tests';
  static String laboratoryDetails(String providerId) => '$apiPrefix/laboratories/$providerId';
  static String laboratoryCatalogue(String providerId) => '$apiPrefix/laboratories/$providerId/catalogue';
  static String laboratoryTestDetails(String testId) => '$apiPrefix/laboratories/tests/$testId';
  static const String labReports = '$apiPrefix/laboratories/reports';
  static const String labTestTypes = '$apiPrefix/laboratories/test-types';

  // Pharmacies & Medicines
  static const String pharmaciesList = '$apiPrefix/pharmacies/list';
  static String pharmacyDetails(String providerId) => '$apiPrefix/pharmacies/$providerId';
  static const String medicines = '$apiPrefix/pharmacies/medicines';
  static const String pharmacyStock = '$apiPrefix/pharmacies/stock';
  static const String medicineAvailability = '$apiPrefix/pharmacies/availability';

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