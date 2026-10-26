import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import '../models/appointment_model.dart';
import 'api_client.dart';
import 'auth_service.dart';

class AppointmentService {
  /// Fetches appointment history for a citizen via FastAPI
  static Future<List<AppointmentModel>> getAppointments([String? citizenId]) async {
    final targetCitizenId = citizenId ?? await AuthService.getCurrentCitizenId();
    if (targetCitizenId == null) return [];

    try {
      final response = await ApiClient.get<List<AppointmentModel>>(
        ApiConfig.appointments,
        queryParams: {'citizen_id': targetCitizenId},
        parser: (json) {
          if (json is List) {
            return json.map((e) => AppointmentModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <AppointmentModel>[];
        },
      );

      if (response.isSuccess && response.data != null) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getAppointments error: $e');
    }

    return [];
  }

  /// Books a new appointment strictly via FastAPI -> Supabase -> FastAPI response
  static Future<AppointmentModel?> bookAppointment({
    required String hospitalId,
    String? doctorId,
    required String appointmentType,
    required String appointmentDate,
    required String timeSlot,
  }) async {
    final citizenId = await AuthService.getCurrentCitizenId();
    if (citizenId == null) {
      throw Exception('Citizen profile is required to book an appointment.');
    }

    final response = await ApiClient.post<AppointmentModel>(
      ApiConfig.appointments,
      body: {
        'citizen_id': citizenId,
        'hospital_id': hospitalId,
        'doctor_id': doctorId,
        'appointment_type': appointmentType,
        'appointment_date': appointmentDate,
        'time_slot': timeSlot,
      },
      parser: (json) => AppointmentModel.fromJson(json as Map<String, dynamic>),
    );

    if (response.isSuccess && response.data != null) {
      return response.data;
    }

    throw Exception(response.errorMessage ?? 'Failed to book appointment via server.');
  }

  /// Fetches an official appointment slip payload via FastAPI
  static Future<Map<String, dynamic>?> getAppointmentSlip(String appointmentId) async {
    try {
      final response = await ApiClient.get<Map<String, dynamic>>(
        '${ApiConfig.appointments}/$appointmentId/slip',
      );

      if (response.isSuccess && response.data != null) {
        return response.data;
      }
    } catch (e) {
      debugPrint('FastAPI getAppointmentSlip error: $e');
    }

    return null;
  }
}
