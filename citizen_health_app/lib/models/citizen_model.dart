class CitizenModel {
  final String citizenId;
  final String? userId;
  final String? guardianId;
  final String name;
  final String? gender;
  final String? phone;
  final String? address;
  final int? wardNumber;
  final String? aadharId;
  final String? bloodGroup;
  final String? userPhotoUrl;
  final String? dateOfBirth;
  final int? age;
  final String? createdAt;

  CitizenModel({
    required this.citizenId,
    this.userId,
    this.guardianId,
    required this.name,
    this.gender,
    this.phone,
    this.address,
    this.wardNumber,
    this.aadharId,
    this.bloodGroup,
    this.userPhotoUrl,
    this.dateOfBirth,
    this.age,
    this.createdAt,
  });

  factory CitizenModel.fromJson(Map<String, dynamic> json) {
    int? parsedAge = json['age'] is int ? json['age'] : null;
    if (parsedAge == null && json['date_of_birth'] != null) {
      try {
        final dob = DateTime.parse(json['date_of_birth'].toString());
        final today = DateTime.now();
        parsedAge = today.year - dob.year;
        if (today.month < dob.month || (today.month == dob.month && today.day < dob.day)) {
          parsedAge--;
        }
      } catch (_) {}
    }

    final rawWard = json['ward_number'] ?? json['ward_id'] ?? json['ward'];
    final parsedWard = rawWard is int ? rawWard : int.tryParse(rawWard?.toString() ?? '');

    return CitizenModel(
      citizenId: (json['citizen_id'] ?? '').toString(),
      userId: json['user_id']?.toString(),
      guardianId: json['guardian_id']?.toString(),
      name: (json['name'] ?? 'Citizen').toString(),
      gender: json['gender']?.toString(),
      phone: json['phone']?.toString(),
      address: json['address']?.toString(),
      wardNumber: parsedWard,
      aadharId: json['aadhar_id']?.toString(),
      bloodGroup: json['blood_group']?.toString(),
      userPhotoUrl: json['user_photo_url']?.toString(),
      dateOfBirth: json['date_of_birth']?.toString(),
      age: parsedAge,
      createdAt: json['created_at']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'citizen_id': citizenId,
      'user_id': userId,
      'guardian_id': guardianId,
      'name': name,
      'gender': gender,
      'phone': phone,
      'address': address,
      'ward_number': wardNumber,
      'aadhar_id': aadharId,
      'blood_group': bloodGroup,
      'user_photo_url': userPhotoUrl,
      'date_of_birth': dateOfBirth,
      'created_at': createdAt,
    };
  }
}
