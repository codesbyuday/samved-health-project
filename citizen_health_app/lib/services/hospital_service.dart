import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import '../models/doctor_model.dart';
import '../models/hospital_model.dart';
import 'api_client.dart';

class HospitalService {
  /// Fetches all hospitals in the municipal ecosystem via FastAPI
  static Future<List<HospitalModel>> getHospitals() async {
    try {
      final response = await ApiClient.get<List<HospitalModel>>(
        ApiConfig.hospitals,
        parser: (json) {
          if (json is List) {
            return json.map((e) => HospitalModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <HospitalModel>[];
        },
      );

      if (response.isSuccess && response.data != null) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getHospitals error: $e');
    }

    return [];
  }

  /// Fetches doctors roster filtered by hospital and/or department via FastAPI
  static Future<List<DoctorModel>> getDoctors({
    String? hospitalId,
    String? department,
  }) async {
    try {
      final endpoint = (hospitalId != null && hospitalId.isNotEmpty)
          ? '${ApiConfig.hospitals}/$hospitalId/doctors'
          : ApiConfig.hospitalDoctors;

      final queryParams = <String, String>{};
      if (department != null && department.isNotEmpty) {
        queryParams['department'] = department;
      }
      if (hospitalId != null && hospitalId.isNotEmpty && endpoint == ApiConfig.hospitalDoctors) {
        queryParams['hospital_id'] = hospitalId;
      }

      final response = await ApiClient.get<List<DoctorModel>>(
        endpoint,
        queryParams: queryParams.isNotEmpty ? queryParams : null,
        parser: (json) {
          if (json is List) {
            return json.map((e) => DoctorModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <DoctorModel>[];
        },
      );

      if (response.isSuccess && response.data != null) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getDoctors error: $e');
    }

    return [];
  }

  /// Fetches unique departments across hospitals via FastAPI
  static Future<List<String>> getDepartments([String? hospitalId]) async {
    try {
      final response = await ApiClient.get<List<String>>(
        ApiConfig.hospitalDepartments,
        queryParams: hospitalId != null ? {'hospital_id': hospitalId} : null,
        parser: (json) {
          if (json is List) {
            return json.map((e) => e.toString()).toList();
          }
          return <String>[];
        },
      );

      if (response.isSuccess && response.data != null) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getDepartments error: $e');
    }

    return [];
  }
}
