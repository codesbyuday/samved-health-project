import 'medicine_model.dart';

class PharmacyModel {
  final String providerId;
  final String name;
  final String role;
  final String? address;
  final String? email;
  final String? phone;
  final String? license;
  final String status;
  final int? wardId;
  final double? latitude;
  final double? longitude;
  final double? distanceKm;
  final int medicinesCount;
  final String operatingHours;
  final List<MedicineModel> medicines;

  const PharmacyModel({
    required this.providerId,
    required this.name,
    this.role = 'pharmacy',
    this.address,
    this.email,
    this.phone,
    this.license,
    this.status = 'approved',
    this.wardId,
    this.latitude,
    this.longitude,
    this.distanceKm,
    this.medicinesCount = 0,
    this.operatingHours = '08:00 AM - 10:00 PM',
    this.medicines = const [],
  });

  String get distanceText {
    if (distanceKm == null) return 'Distance N/A';
    return '${distanceKm!.toStringAsFixed(1)} km away';
  }

  String get formattedMedicinesCount {
    if (medicinesCount == 0 && medicines.isNotEmpty) {
      return '${medicines.length} medicines in stock';
    }
    if (medicinesCount == 1) return '1 medicine in stock';
    return '$medicinesCount medicines in stock';
  }

  String get displayPhone {
    if (phone != null && phone!.trim().isNotEmpty) return phone!.trim();
    return '+91 217 2740300';
  }

  PharmacyModel copyWith({
    String? providerId,
    String? name,
    String? role,
    String? address,
    String? email,
    String? phone,
    String? license,
    String? status,
    int? wardId,
    double? latitude,
    double? longitude,
    double? distanceKm,
    int? medicinesCount,
    String? operatingHours,
    List<MedicineModel>? medicines,
  }) {
    return PharmacyModel(
      providerId: providerId ?? this.providerId,
      name: name ?? this.name,
      role: role ?? this.role,
      address: address ?? this.address,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      license: license ?? this.license,
      status: status ?? this.status,
      wardId: wardId ?? this.wardId,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      distanceKm: distanceKm ?? this.distanceKm,
      medicinesCount: medicinesCount ?? this.medicinesCount,
      operatingHours: operatingHours ?? this.operatingHours,
      medicines: medicines ?? this.medicines,
    );
  }

  factory PharmacyModel.fromJson(Map<String, dynamic> json) {
    // Parse medicines list if present (e.g. from pharmacy details endpoint)
    List<MedicineModel> medsList = [];
    if (json['medicines'] is List) {
      medsList = (json['medicines'] as List)
          .map((m) => MedicineModel.fromJson(Map<String, dynamic>.from(m as Map)))
          .toList();
    }

    // Determine medicines count
    int count = 0;
    if (json['medicines_count'] != null) {
      count = int.tryParse(json['medicines_count'].toString()) ?? 0;
    } else if (medsList.isNotEmpty) {
      count = medsList.length;
    }

    return PharmacyModel(
      providerId: (json['provider_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? json['pharmacy_name'] ?? 'Pharmacy').toString(),
      role: (json['role'] ?? 'pharmacy').toString(),
      address: json['address']?.toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      license: json['license']?.toString(),
      status: (json['status'] ?? 'approved').toString(),
      wardId: json['ward_id'] != null ? int.tryParse(json['ward_id'].toString()) : null,
      latitude: json['latitude'] != null ? double.tryParse(json['latitude'].toString()) : null,
      longitude: json['longitude'] != null ? double.tryParse(json['longitude'].toString()) : null,
      distanceKm: json['distance_km'] != null ? double.tryParse(json['distance_km'].toString()) : null,
      medicinesCount: count,
      operatingHours: (json['operating_hours'] ?? '08:00 AM - 10:00 PM').toString(),
      medicines: medsList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'provider_id': providerId,
      'name': name,
      'role': role,
      'address': address,
      'email': email,
      'phone': phone,
      'license': license,
      'status': status,
      'ward_id': wardId,
      'latitude': latitude,
      'longitude': longitude,
      'distance_km': distanceKm,
      'medicines_count': medicinesCount,
      'operating_hours': operatingHours,
    };
  }
}
