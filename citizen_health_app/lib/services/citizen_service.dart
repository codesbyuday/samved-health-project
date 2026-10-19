import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/citizen_model.dart';
import '../models/health_card_model.dart';
import '../models/medical_record_model.dart';
import '../models/vaccination_record_model.dart';
import 'api_client.dart';
import 'auth_service.dart';

class CitizenService {
  /// Fetches citizen profile by citizen_id via FastAPI
  static Future<CitizenModel?> getCitizenById(String citizenId) async {
    try {
      final response = await ApiClient.get<CitizenModel>(
        '${ApiConfig.citizens}/$citizenId',
        parser: (json) => CitizenModel.fromJson(json as Map<String, dynamic>),
      );

      if (response.isSuccess && response.data != null) {
        return response.data;
      }
    } catch (e) {
      debugPrint('FastAPI getCitizenById error: $e');
    }

    return null;
  }

  /// Fetches citizen profile for the currently logged-in user via FastAPI
  static Future<CitizenModel?> getCurrentProfile() async {
    final userId = await AuthService.getCurrentUserId();
    if (userId == null || userId.isEmpty) return null;

    // 1. Check by stored citizen_id
    final citizenId = await AuthService.getCurrentCitizenId();
    if (citizenId != null && citizenId.isNotEmpty) {
      final citizen = await getCitizenById(citizenId);
      if (citizen != null && (citizen.userId == null || citizen.userId == userId)) {
        return citizen;
      }
    }

    // 2. Query via citizen search using phone
    try {
      final prefs = await SharedPreferences.getInstance();
      final phone = prefs.getString(AuthService.prefUserPhoneKey);
      if (phone != null && phone.isNotEmpty) {
        final response = await ApiClient.get<List<CitizenModel>>(
          ApiConfig.citizenSearch,
          queryParams: {'q': phone},
          parser: (json) {
            if (json is List) {
              return json.map((e) => CitizenModel.fromJson(e as Map<String, dynamic>)).toList();
            }
            return <CitizenModel>[];
          },
        );

        if (response.isSuccess && response.data != null && response.data!.isNotEmpty) {
          final matched = response.data!.firstWhere(
            (c) => c.phone == phone || c.userId == userId,
            orElse: () => response.data!.first,
          );
          // Cache the resolved citizen ID for subsequent calls
          await prefs.setString(AuthService.prefCitizenIdKey, matched.citizenId);
          return matched;
        }
      }
    } catch (e) {
      debugPrint('FastAPI getCurrentProfile search error: $e');
    }

    return null;
  }

  /// Fetches the digital QR health card payload from FastAPI endpoint
  static Future<HealthCardModel?> getHealthCard(String citizenId) async {
    try {
      final response = await ApiClient.get<HealthCardModel>(
        '${ApiConfig.healthCards}/$citizenId',
        parser: (json) => HealthCardModel.fromJson(json as Map<String, dynamic>),
      );

      if (response.isSuccess && response.data != null) {
        return response.data;
      }
    } catch (e) {
      debugPrint('FastAPI getHealthCard error: $e');
    }

    return null;
  }

  /// Fetches medical history / health records for a citizen via FastAPI
  static Future<List<MedicalRecordModel>> getHealthRecords([String? citizenId]) async {
    final targetCitizenId = citizenId ?? await AuthService.getCurrentCitizenId();
    if (targetCitizenId == null || targetCitizenId.isEmpty) return [];

    try {
      final response = await ApiClient.get<List<MedicalRecordModel>>(
        ApiConfig.citizenHealthRecords(targetCitizenId),
        parser: (json) {
          if (json is List) {
            return json.map((e) => MedicalRecordModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <MedicalRecordModel>[];
        },
      );

      if (response.isSuccess && response.data != null) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getHealthRecords error: $e');
    }

    return [];
  }

  /// Fetches vaccination records for a citizen via FastAPI
  static Future<List<VaccinationRecordModel>> getVaccinationRecords([String? citizenId]) async {
    final targetCitizenId = citizenId ?? await AuthService.getCurrentCitizenId();
    if (targetCitizenId == null || targetCitizenId.isEmpty) return [];

    try {
      final response = await ApiClient.get<List<VaccinationRecordModel>>(
        ApiConfig.citizenVaccinations(targetCitizenId),
        parser: (json) {
          if (json is List) {
            return json.map((e) => VaccinationRecordModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <VaccinationRecordModel>[];
        },
      );

      if (response.isSuccess && response.data != null) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getVaccinationRecords error: $e');
    }

    return [];
  }

  /// Submits a citizen complaint / feedback via FastAPI
  static Future<bool> submitComplaint({
    required String description,
    String? category,
    String? hospitalId,
    String? priority,
    String? citizenId,
  }) async {
    final targetCitizenId = citizenId ?? await AuthService.getCurrentCitizenId();
    if (targetCitizenId == null || targetCitizenId.isEmpty) return false;

    try {
      final response = await ApiClient.post<Map<String, dynamic>>(
        ApiConfig.citizenComplaints(targetCitizenId),
        body: {
          'category': category ?? 'other',
          'description': description.trim(),
          'hospital_id': hospitalId,
          'priority': priority ?? 'low',
        },
      );

      if (response.isSuccess) {
        return true;
      }
    } catch (e) {
      debugPrint('FastAPI submitComplaint error: $e');
    }

    return false;
  }
}
