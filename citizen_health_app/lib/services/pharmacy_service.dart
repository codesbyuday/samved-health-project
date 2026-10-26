import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import '../models/medicine_model.dart';
import 'api_client.dart';

class PharmacyService {
  /// Fetches medicines catalog from municipal pharmacies via FastAPI
  static Future<List<MedicineModel>> getMedicines({String? query}) async {
    try {
      final response = await ApiClient.get<List<MedicineModel>>(
        ApiConfig.medicines,
        parser: (json) {
          if (json is List) {
            return json.map((e) => MedicineModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <MedicineModel>[];
        },
      );

      if (response.isSuccess && response.data != null && response.data!.isNotEmpty) {
        var list = response.data!;
        if (query != null && query.trim().isNotEmpty) {
          final q = query.trim().toLowerCase();
          list = list.where((m) =>
            m.name.toLowerCase().contains(q) ||
            (m.category?.toLowerCase().contains(q) ?? false) ||
            (m.manufacturer?.toLowerCase().contains(q) ?? false)
          ).toList();
        }
        return list;
      }
    } catch (e) {
      debugPrint('FastAPI getMedicines error: $e');
    }

    return [];
  }

  /// Fetches pharmacy stock by hospital / pharmacy ID via FastAPI
  static Future<List<MedicineModel>> getStock({String? hospitalId}) async {
    try {
      final response = await ApiClient.get<List<MedicineModel>>(
        ApiConfig.pharmacyStock,
        queryParams: hospitalId != null ? {'hospital_id': hospitalId} : null,
        parser: (json) {
          if (json is List) {
            return json.map((e) => MedicineModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <MedicineModel>[];
        },
      );

      if (response.isSuccess && response.data != null) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getStock error: $e');
    }

    return [];
  }
}
