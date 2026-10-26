import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import '../models/alert_model.dart';
import '../models/ward_risk_model.dart';
import 'api_client.dart';

class CampaignModel {
  final String? campaignId;
  final String name;
  final String? vaccineType;
  final String? targetPopulation;
  final String? date;
  final String? status;
  final int? wardId;

  CampaignModel({
    this.campaignId,
    required this.name,
    this.vaccineType,
    this.targetPopulation,
    this.date,
    this.status,
    this.wardId,
  });

  factory CampaignModel.fromJson(Map<String, dynamic> json) {
    final rawWard = json['ward_id'] ?? json['ward_number'] ?? json['ward'] ?? json['target_ward'];
    return CampaignModel(
      campaignId: json['campaign_id']?.toString(),
      name: (json['name'] ?? json['title'] ?? 'Vaccination Campaign').toString(),
      vaccineType: (json['vaccine_type'] ?? json['vaccine_name'])?.toString(),
      targetPopulation: (json['target_population'] ?? json['target_count'])?.toString(),
      date: (json['date'] ?? json['start_date'])?.toString(),
      status: json['status']?.toString(),
      wardId: rawWard is int ? rawWard : int.tryParse(rawWard?.toString() ?? ''),
    );
  }
}

class SurveillanceService {
  /// Fetches public health analytics & disease overview via FastAPI
  static Future<Map<String, dynamic>?> getPublicAnalytics() async {
    try {
      final response = await ApiClient.get<Map<String, dynamic>>(
        ApiConfig.publicAnalytics,
      );

      if (response.isSuccess && response.data != null) {
        return response.data;
      }
    } catch (e) {
      debugPrint('FastAPI getPublicAnalytics error: $e');
    }

    return null;
  }

  /// Fetches active SMC health alerts via FastAPI
  static Future<List<AlertModel>> getAlerts({String? severity}) async {
    try {
      final response = await ApiClient.get<List<AlertModel>>(
        ApiConfig.smcAlerts,
        parser: (json) {
          if (json is List) {
            return json.map((e) => AlertModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <AlertModel>[];
        },
      );

      if (response.isSuccess && response.data != null && response.data!.isNotEmpty) {
        var list = response.data!;
        if (severity != null && severity != 'all') {
          list = list.where((a) => a.severity.toLowerCase() == severity.toLowerCase()).toList();
        }
        return list;
      }
    } catch (e) {
      debugPrint('FastAPI getAlerts error: $e');
    }

    return [];
  }

  /// Fetches ward list and health risk index via FastAPI
  static Future<List<WardRiskModel>> getWardRisks() async {
    try {
      final response = await ApiClient.get<List<WardRiskModel>>(
        ApiConfig.smcWards,
        parser: (json) {
          if (json is List) {
            return json.map((e) => WardRiskModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <WardRiskModel>[];
        },
      );

      if (response.isSuccess && response.data != null && response.data!.isNotEmpty) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getWardRisks error: $e');
    }

    return [];
  }

  /// Fetches public vaccination campaigns from SMC via FastAPI
  static Future<List<CampaignModel>> getCampaigns({int? wardNumber}) async {
    try {
      final response = await ApiClient.get<List<CampaignModel>>(
        ApiConfig.smcCampaigns,
        parser: (json) {
          if (json is List) {
            return json.map((e) => CampaignModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <CampaignModel>[];
        },
      );

      if (response.isSuccess && response.data != null) {
        var list = response.data!;
        if (wardNumber != null) {
          list = list.where((c) => c.wardId == null || c.wardId == wardNumber).toList();
        }
        return list;
      }
    } catch (e) {
      debugPrint('FastAPI getCampaigns error: $e');
    }

    return [];
  }
}
