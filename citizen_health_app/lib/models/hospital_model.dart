class HospitalModel {
  final String hospitalId;
  final String name;
  final String? type;
  final String? address;
  final int? wardId;
  final String? contactNumber;
  final String? email;
  final bool verifiedBySmc;
  final double? latitude;
  final double? longitude;
  final double? distance;

  HospitalModel({
    required this.hospitalId,
    required this.name,
    this.type,
    this.address,
    this.wardId,
    this.contactNumber,
    this.email,
    this.verifiedBySmc = false,
    this.latitude,
    this.longitude,
    this.distance,
  });

  factory HospitalModel.fromJson(Map<String, dynamic> json) {
    double? lat;
    double? lng;
    if (json['lat'] != null) {
      lat = double.tryParse(json['lat'].toString());
    } else if (json['latitude'] != null) {
      lat = double.tryParse(json['latitude'].toString());
    }
    if (json['lng'] != null) {
      lng = double.tryParse(json['lng'].toString());
    } else if (json['longitude'] != null) {
      lng = double.tryParse(json['longitude'].toString());
    }

    return HospitalModel(
      hospitalId: (json['hospital_id'] ?? '').toString(),
      name: (json['name'] ?? 'Hospital').toString(),
      type: json['type']?.toString(),
      address: json['address']?.toString(),
      wardId: json['ward_id'] is int ? json['ward_id'] : int.tryParse(json['ward_id']?.toString() ?? ''),
      contactNumber: json['contact_number']?.toString(),
      email: json['email']?.toString(),
      verifiedBySmc: json['verified_by_smc'] == true,
      latitude: lat,
      longitude: lng,
      distance: json['distance'] != null ? double.tryParse(json['distance'].toString()) : null,
    );
  }

  HospitalModel copyWith({
    double? distance,
    double? latitude,
    double? longitude,
  }) {
    return HospitalModel(
      hospitalId: hospitalId,
      name: name,
      type: type,
      address: address,
      wardId: wardId,
      contactNumber: contactNumber,
      email: email,
      verifiedBySmc: verifiedBySmc,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      distance: distance ?? this.distance,
    );
  }
}
