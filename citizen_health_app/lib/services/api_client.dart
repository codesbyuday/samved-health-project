import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiResponse<T> {
  final bool isSuccess;
  final T? data;
  final String? errorMessage;
  final int statusCode;

  ApiResponse({
    required this.isSuccess,
    this.data,
    this.errorMessage,
    this.statusCode = 200,
  });

  factory ApiResponse.success(T data, {int statusCode = 200}) {
    return ApiResponse(isSuccess: true, data: data, statusCode: statusCode);
  }

  factory ApiResponse.error(String message, {int statusCode = 500}) {
    return ApiResponse(isSuccess: false, errorMessage: message, statusCode: statusCode);
  }
}

class ApiClient {
  static const Duration timeoutDuration = Duration(seconds: 25);
  static const String tokenKey = 'auth_token';

  static String _formatNetworkError(dynamic error) {
    final str = error.toString().toLowerCase();
    if (str.contains('socketexception') ||
        str.contains('failed host lookup') ||
        str.contains('network is unreachable') ||
        str.contains('no address associated with hostname') ||
        str.contains('connection refused') ||
        str.contains('connection reset') ||
        str.contains('clientexception') ||
        str.contains('handshakeexception')) {
      return 'No internet connection. Please check your mobile data or Wi-Fi and try again.';
    }
    if (str.contains('timeoutexception') || str.contains('timed out')) {
      return 'Connection timed out. Please check your internet connection and try again.';
    }
    return 'Unable to connect to healthcare server. Please check your internet connection and try again.';
  }

  static Future<Map<String, String>> _buildHeaders({bool requireAuth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requireAuth) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString(tokenKey);
        if (token != null && token.isNotEmpty) {
          headers['Authorization'] = 'Bearer $token';
        }
      } catch (_) {}
    }

    return headers;
  }

  static Future<Uri> _buildUri(String path, [Map<String, dynamic>? queryParams]) async {
    final baseUrl = await ApiConfig.getBaseUrl();
    var fullUrl = '$baseUrl$path';

    if (queryParams != null && queryParams.isNotEmpty) {
      final cleanParams = <String, String>{};
      queryParams.forEach((key, value) {
        if (value != null) {
          cleanParams[key] = value.toString();
        }
      });
      final query = Uri(queryParameters: cleanParams).query;
      if (query.isNotEmpty) {
        fullUrl += '?$query';
      }
    }

    return Uri.parse(fullUrl);
  }

  static ApiResponse<T> _handleResponse<T>(
    http.Response response,
    T Function(dynamic json)? parser,
  ) {
    final statusCode = response.statusCode;

    try {
      final decoded = response.body.isNotEmpty ? jsonDecode(response.body) : null;

      if (statusCode >= 200 && statusCode < 300) {
        if (parser != null) {
          return ApiResponse.success(parser(decoded), statusCode: statusCode);
        }
        return ApiResponse.success(decoded as T, statusCode: statusCode);
      }

      String message = 'Request failed with status $statusCode';
      if (decoded is Map) {
        if (decoded.containsKey('detail')) {
          final detail = decoded['detail'];
          message = detail is String ? detail : jsonEncode(detail);
        } else if (decoded.containsKey('error')) {
          final err = decoded['error'];
          message = err is String ? err : jsonEncode(err);
        } else if (decoded.containsKey('message')) {
          message = decoded['message'].toString();
        }
      }

      return ApiResponse.error(message, statusCode: statusCode);
    } catch (e) {
      if (statusCode >= 200 && statusCode < 300) {
        return ApiResponse.success(response.body as T, statusCode: statusCode);
      }
      return ApiResponse.error('Failed to parse server response: $e', statusCode: statusCode);
    }
  }

  /// GET Request
  static Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParams,
    T Function(dynamic json)? parser,
    bool requireAuth = false,
  }) async {
    try {
      final uri = await _buildUri(path, queryParams);
      final headers = await _buildHeaders(requireAuth: requireAuth);

      final response = await http.get(uri, headers: headers).timeout(timeoutDuration);
      return _handleResponse<T>(response, parser);
    } on TimeoutException {
      return ApiResponse.error('Connection timed out. Please check your internet connection and try again.');
    } catch (e) {
      debugPrint('ApiClient GET error [$path]: $e');
      return ApiResponse.error(_formatNetworkError(e));
    }
  }

  /// POST Request
  static Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic body,
    T Function(dynamic json)? parser,
    bool requireAuth = false,
  }) async {
    try {
      final uri = await _buildUri(path);
      final headers = await _buildHeaders(requireAuth: requireAuth);

      final payload = body != null ? jsonEncode(body) : null;
      final response = await http.post(uri, headers: headers, body: payload).timeout(timeoutDuration);
      return _handleResponse<T>(response, parser);
    } on TimeoutException {
      return ApiResponse.error('Connection timed out. Please check your internet connection and try again.');
    } catch (e) {
      debugPrint('ApiClient POST error [$path]: $e');
      return ApiResponse.error(_formatNetworkError(e));
    }
  }

  /// PATCH Request
  static Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic body,
    T Function(dynamic json)? parser,
    bool requireAuth = false,
  }) async {
    try {
      final uri = await _buildUri(path);
      final headers = await _buildHeaders(requireAuth: requireAuth);

      final payload = body != null ? jsonEncode(body) : null;
      final response = await http.patch(uri, headers: headers, body: payload).timeout(timeoutDuration);
      return _handleResponse<T>(response, parser);
    } on TimeoutException {
      return ApiResponse.error('Connection timed out. Please check your internet connection and try again.');
    } catch (e) {
      debugPrint('ApiClient PATCH error [$path]: $e');
      return ApiResponse.error(_formatNetworkError(e));
    }
  }

  /// DELETE Request
  static Future<ApiResponse<T>> delete<T>(
    String path, {
    T Function(dynamic json)? parser,
    bool requireAuth = false,
  }) async {
    try {
      final uri = await _buildUri(path);
      final headers = await _buildHeaders(requireAuth: requireAuth);

      final response = await http.delete(uri, headers: headers).timeout(timeoutDuration);
      return _handleResponse<T>(response, parser);
    } on TimeoutException {
      return ApiResponse.error('Connection timed out. Please check your internet connection and try again.');
    } catch (e) {
      debugPrint('ApiClient DELETE error [$path]: $e');
      return ApiResponse.error(_formatNetworkError(e));
    }
  }
}
