import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import '../config/supabase_config.dart';
import '../models/lab_report_model.dart';
import 'api_client.dart';
import 'auth_service.dart';

class LabService {
  /// Fetches all diagnostic lab reports for a citizen
  static Future<List<LabReportModel>> getReports([String? citizenId]) async {
    final targetCitizenId = citizenId ?? await AuthService.getCurrentCitizenId();
    if (targetCitizenId == null) return [];

    // 1. Try FastAPI endpoint: GET /api/v1/laboratories/reports?citizen_id={id}
    try {
      final response = await ApiClient.get<List<LabReportModel>>(
        ApiConfig.labReports,
        queryParams: {'citizen_id': targetCitizenId},
        parser: (json) {
          if (json is List) {
            return json.map((e) => LabReportModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <LabReportModel>[];
        },
      );

      if (response.isSuccess && response.data != null) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getReports error: $e');
    }

    // 2. Direct Supabase fallback
    try {
      final reports = await supabase
          .from('diagnostic_reports')
          .select('''
            report_id,
            result,
            description,
            report_file_url,
            test_date,
            status,
            test_types (
              test_name,
              category
            ),
            hospitals (
              name
            )
          ''')
          .eq('citizen_id', targetCitizenId)
          .order('test_date', ascending: false);

      if (reports is List) {
        return reports.map((e) => LabReportModel.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      }
    } catch (e) {
      debugPrint('Supabase getReports fallback error: $e');
    }

    return [];
  }

  /// Fetches download / viewing file URL for a report
  static Future<String?> getReportFileUrl(String reportId) async {
    // 1. Try FastAPI endpoint: GET /api/v1/laboratories/reports/{id}/file
    try {
      final response = await ApiClient.get<Map<String, dynamic>>(
        '${ApiConfig.labReports}/$reportId/file',
      );

      if (response.isSuccess && response.data != null) {
        return response.data!['file_url']?.toString() ?? response.data!['download_url']?.toString();
      }
    } catch (e) {
      debugPrint('FastAPI getReportFileUrl error: $e');
    }

    return null;
  }
}
