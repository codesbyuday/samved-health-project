class LabTestDetailModel {
  final String labTestId;
  final String providerId;
  final int testTypeId;
  final int price;
  final String testName;
  final String testCategory;
  final String? description;
  final String? sampleType;
  final String? preparation;
  final String? turnaroundTime;
  final String? laboratoryName;
  final String? laboratoryAddress;
  final String? laboratoryPhone;
  final String? laboratoryEmail;
  final String? laboratoryLicense;
  final String? laboratoryStatus;
  final double? latitude;
  final double? longitude;
  final double? distanceKm;

  const LabTestDetailModel({
    required this.labTestId,
    required this.providerId,
    required this.testTypeId,
    required this.price,
    required this.testName,
    required this.testCategory,
    this.description,
    this.sampleType,
    this.preparation,
    this.turnaroundTime,
    this.laboratoryName,
    this.laboratoryAddress,
    this.laboratoryPhone,
    this.laboratoryEmail,
    this.laboratoryLicense,
    this.laboratoryStatus,
    this.latitude,
    this.longitude,
    this.distanceKm,
  });

  factory LabTestDetailModel.fromJson(Map<String, dynamic> json) {
    int parsedPrice = 0;
    if (json['price'] != null) {
      parsedPrice = int.tryParse(json['price'].toString()) ?? 0;
    }

    double? lat;
    if (json['latitude'] != null) {
      lat = double.tryParse(json['latitude'].toString());
    }

    double? lon;
    if (json['longitude'] != null) {
      lon = double.tryParse(json['longitude'].toString());
    }

    double? dist;
    if (json['distance_km'] != null) {
      dist = double.tryParse(json['distance_km'].toString());
    }

    int typeId = 0;
    if (json['test_type_id'] != null) {
      typeId = int.tryParse(json['test_type_id'].toString()) ?? 0;
    }

    return LabTestDetailModel(
      labTestId: json['lab_test_id']?.toString() ?? '',
      providerId: json['provider_id']?.toString() ?? '',
      testTypeId: typeId,
      price: parsedPrice,
      testName: json['test_name']?.toString() ?? 'Diagnostic Test',
      testCategory: json['test_category']?.toString() ?? 'General Pathology',
      description: json['description']?.toString(),
      sampleType: json['sample_type']?.toString() ?? 'Venous Blood Sample',
      preparation: json['preparation']?.toString() ?? 'No special preparation required.',
      turnaroundTime: json['turnaround_time']?.toString() ?? 'Within 6-12 hours',
      laboratoryName: json['laboratory_name']?.toString() ?? 'Diagnostic Center',
      laboratoryAddress: json['laboratory_address']?.toString() ?? 'Solapur, Maharashtra',
      laboratoryPhone: json['laboratory_phone']?.toString(),
      laboratoryEmail: json['laboratory_email']?.toString(),
      laboratoryLicense: json['laboratory_license']?.toString(),
      laboratoryStatus: json['laboratory_status']?.toString() ?? 'approved',
      latitude: lat,
      longitude: lon,
      distanceKm: dist,
    );
  }

  LabTestDetailModel copyWith({
    double? distanceKm,
    String? laboratoryName,
    String? laboratoryAddress,
    String? laboratoryPhone,
    double? latitude,
    double? longitude,
  }) {
    return LabTestDetailModel(
      labTestId: labTestId,
      providerId: providerId,
      testTypeId: testTypeId,
      price: price,
      testName: testName,
      testCategory: testCategory,
      description: description,
      sampleType: sampleType,
      preparation: preparation,
      turnaroundTime: turnaroundTime,
      laboratoryName: laboratoryName ?? this.laboratoryName,
      laboratoryAddress: laboratoryAddress ?? this.laboratoryAddress,
      laboratoryPhone: laboratoryPhone ?? this.laboratoryPhone,
      laboratoryEmail: laboratoryEmail,
      laboratoryLicense: laboratoryLicense,
      laboratoryStatus: laboratoryStatus,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      distanceKm: distanceKm ?? this.distanceKm,
    );
  }
}

class LaboratoryModel {
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
  final String operatingHours;
  final int testsCount;
  final double? distanceKm;
  final List<LabTestDetailModel> tests;

  const LaboratoryModel({
    required this.providerId,
    required this.name,
    this.role = 'lab',
    this.address,
    this.email,
    this.phone,
    this.license,
    this.status = 'approved',
    this.wardId,
    this.latitude,
    this.longitude,
    this.operatingHours = '08:00 AM - 08:00 PM',
    this.testsCount = 0,
    this.distanceKm,
    this.tests = const [],
  });

  factory LaboratoryModel.fromJson(Map<String, dynamic> json) {
    double? lat;
    if (json['latitude'] != null) {
      lat = double.tryParse(json['latitude'].toString());
    }

    double? lon;
    if (json['longitude'] != null) {
      lon = double.tryParse(json['longitude'].toString());
    }

    double? dist;
    if (json['distance_km'] != null) {
      dist = double.tryParse(json['distance_km'].toString());
    }

    int tCount = 0;
    if (json['tests_count'] != null) {
      tCount = int.tryParse(json['tests_count'].toString()) ?? 0;
    }

    int? wId;
    if (json['ward_id'] != null) {
      wId = int.tryParse(json['ward_id'].toString());
    }

    List<LabTestDetailModel> parsedTests = [];
    if (json['tests'] is List) {
      parsedTests = (json['tests'] as List)
          .map((t) => LabTestDetailModel.fromJson(t as Map<String, dynamic>))
          .toList();
      if (tCount == 0 && parsedTests.isNotEmpty) {
        tCount = parsedTests.length;
      }
    }

    return LaboratoryModel(
      providerId: json['provider_id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Diagnostic Laboratory',
      role: json['role']?.toString() ?? 'lab',
      address: json['address']?.toString() ?? 'Solapur, Maharashtra',
      email: json['email']?.toString(),
      phone: json['phone']?.toString() ?? '+91 217 2740300',
      license: json['license']?.toString(),
      status: json['status']?.toString() ?? 'approved',
      wardId: wId,
      latitude: lat,
      longitude: lon,
      operatingHours: json['operating_hours']?.toString() ?? '08:00 AM - 08:00 PM',
      testsCount: tCount,
      distanceKm: dist,
      tests: parsedTests,
    );
  }

  LaboratoryModel copyWith({
    double? distanceKm,
    int? testsCount,
    List<LabTestDetailModel>? tests,
  }) {
    return LaboratoryModel(
      providerId: providerId,
      name: name,
      role: role,
      address: address,
      email: email,
      phone: phone,
      license: license,
      status: status,
      wardId: wardId,
      latitude: latitude,
      longitude: longitude,
      operatingHours: operatingHours,
      testsCount: testsCount ?? this.testsCount,
      distanceKm: distanceKm ?? this.distanceKm,
      tests: tests ?? this.tests,
    );
  }
}
