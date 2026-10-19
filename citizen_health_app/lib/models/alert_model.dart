class AlertModel {
  final String alertId;
  final String title;
  final String description;
  final String severity; // critical, high, medium, low, info
  final int? wardNumber;
  final String? alertType;
  final String? createdAt;
  final bool isActive;

  AlertModel({
    required this.alertId,
    required this.title,
    required this.description,
    required this.severity,
    this.wardNumber,
    this.alertType,
    this.createdAt,
    this.isActive = true,
  });

  factory AlertModel.fromJson(Map<String, dynamic> json) {
    final rawWard = json['ward_number'] ?? json['ward_id'] ?? json['ward'];
    return AlertModel(
      alertId: (json['alert_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? 'Health Alert').toString(),
      description: (json['description'] ?? json['message'] ?? '').toString(),
      severity: (json['severity'] ?? 'medium').toString().toLowerCase(),
      wardNumber: rawWard is int ? rawWard : int.tryParse(rawWard?.toString() ?? ''),
      alertType: (json['alert_type'] ?? json['type'])?.toString(),
      createdAt: json['created_at']?.toString(),
      isActive: json['is_active'] != false,
    );
  }
}
