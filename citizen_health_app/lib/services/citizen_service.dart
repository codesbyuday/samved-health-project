import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../config/supabase_config.dart';
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

    // 2. Query via citizen search using phone or email
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

      final email = prefs.getString(AuthService.prefUserEmailKey);
      if (email != null && email.isNotEmpty) {
        final response = await ApiClient.get<List<CitizenModel>>(
          ApiConfig.citizenSearch,
          queryParams: {'q': email},
          parser: (json) {
            if (json is List) {
              return json.map((e) => CitizenModel.fromJson(e as Map<String, dynamic>)).toList();
            }
            return <CitizenModel>[];
          },
        );

        if (response.isSuccess && response.data != null && response.data!.isNotEmpty) {
          final matched = response.data!.firstWhere(
            (c) => c.userId == userId,
            orElse: () => response.data!.first,
          );
          await prefs.setString(AuthService.prefCitizenIdKey, matched.citizenId);
          return matched;
        }
      }
    } catch (e) {
      debugPrint('FastAPI getCurrentProfile search error: $e');
    }

    // 3. Direct Supabase fallback by user_id
    try {
      final rows = await supabase
          .from('citizens')
          .select()
          .eq('user_id', userId)
          .limit(1);
      if (rows.isNotEmpty) {
        final citizen = CitizenModel.fromJson(rows.first);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AuthService.prefCitizenIdKey, citizen.citizenId);
        return citizen;
      }
    } catch (sbErr) {
      debugPrint('Supabase direct citizen lookup error: $sbErr');
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

  /// Known municipal hospital directory lookup for fallback resolution
  static const Map<String, (String, String)> _municipalHospitals = {
    'HOSP001': ('Solapur Civil Hospital', 'Railway Lines, Solapur - 413001'),
    'HOSP002': ('Siddheshwar Multispeciality Hospital', 'Siddheshwar Peth, Solapur - 413003'),
    'HOSP003': ('Ashwini Rural Medical Centre', 'Begam Peth, Solapur - 413002'),
    'HOSP004': ('Dhanraj Girji Hospital', 'MIDC Area, Akkalkot Road, Solapur - 413006'),
    'HOSP005': ('Navjeevan Healthcare Centre', 'Shastri Nagar, Solapur - 413004'),
    'HOSP006': ('Lokmangal Hospital', 'Jule Solapur, Solapur - 413007'),
    'HOS-500988A8': ('Cancer Chowk Hospital', 'Cancer Chowk, Wani Plot, Solapur'),
  };

  static MedicalRecordModel _enrichRecord(MedicalRecordModel r) {
    if (r.hospitalAddress != null && r.hospitalAddress!.trim().isNotEmpty) {
      return r;
    }
    final hid = (r.hospitalId ?? '').trim().toUpperCase();
    if (_municipalHospitals.containsKey(hid)) {
      final info = _municipalHospitals[hid]!;
      return MedicalRecordModel(
        recordId: r.recordId,
        citizenId: r.citizenId,
        hospitalId: r.hospitalId,
        hospitalName: (r.hospitalName.isNotEmpty && r.hospitalName != 'Solapur Municipal Health Center')
            ? r.hospitalName
            : info.$1,
        hospitalAddress: info.$2,
        staffId: r.staffId,
        doctorName: r.doctorName,
        department: r.department,
        diagnosis: r.diagnosis,
        prescription: r.prescription,
        notes: r.notes,
        visitDate: r.visitDate,
      );
    }
    return r;
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
            return json
                .map((e) => _enrichRecord(MedicalRecordModel.fromJson(e as Map<String, dynamic>)))
                .toList();
          }
          return <MedicalRecordModel>[];
        },
      );

      if (response.isSuccess && response.data != null && response.data!.isNotEmpty) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getHealthRecords error: $e');
    }

    // Direct Supabase Fallback with relational joins
    try {
      final records = await supabase
          .from('health_records')
          .select('''
            record_id,
            citizen_id,
            hospital_id,
            staff_id,
            diagnosis,
            prescription,
            notes,
            visit_date,
            hospitals (
              name,
              address
            ),
            hospital_staff (
              name,
              department
            )
          ''')
          .eq('citizen_id', targetCitizenId)
          .order('visit_date', ascending: false);

      if (records.isNotEmpty) {
        return records
            .map((e) => _enrichRecord(MedicalRecordModel.fromJson(Map<String, dynamic>.from(e as Map))))
            .toList();
      }
    } catch (e) {
      debugPrint('Supabase getHealthRecords fallback error: $e');
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
