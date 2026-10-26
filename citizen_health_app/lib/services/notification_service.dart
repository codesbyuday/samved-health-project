import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import '../models/notification_model.dart';
import 'api_client.dart';
import 'auth_service.dart';

class NotificationService {
  /// Fetches notifications for citizen (personal, ward-based, broadcast) via FastAPI
  static Future<List<NotificationModel>> getNotifications() async {
    final userId = await AuthService.getCurrentUserId();

    try {
      final response = await ApiClient.get<List<NotificationModel>>(
        ApiConfig.notifications,
        queryParams: userId != null ? {'recipient_id': userId} : null,
        parser: (json) {
          if (json is List) {
            return json.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <NotificationModel>[];
        },
      );

      if (response.isSuccess && response.data != null) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getNotifications error: $e');
    }

    return [];
  }
}
