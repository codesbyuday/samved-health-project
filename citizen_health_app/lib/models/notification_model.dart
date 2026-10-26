class NotificationModel {
  final String notificationId;
  final String title;
  final String message;
  final String? type;
  final String? priority;
  final bool isRead;
  final String? createdAt;
  final String? actionUrl;

  NotificationModel({
    required this.notificationId,
    required this.title,
    required this.message,
    this.type,
    this.priority,
    this.isRead = false,
    this.createdAt,
    this.actionUrl,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      notificationId: (json['notification_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? 'Notification').toString(),
      message: (json['message'] ?? json['body'] ?? '').toString(),
      type: json['type']?.toString() ?? json['target_type']?.toString(),
      priority: json['priority']?.toString(),
      isRead: json['is_read'] == true,
      createdAt: json['created_at']?.toString(),
      actionUrl: json['action_url']?.toString(),
    );
  }
}
