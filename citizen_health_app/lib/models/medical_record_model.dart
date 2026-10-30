class MedicalRecordModel {
  final String recordId;
  final String citizenId;
  final String? hospitalId;
  final String hospitalName;
  final String? hospitalAddress;
  final String? staffId;
  final String doctorName;
  final String? department;
  final String? diagnosis;
  final String? prescription;
  final String? notes;
  final String? visitDate;

  MedicalRecordModel({
    required this.recordId,
    required this.citizenId,
    this.hospitalId,
    required this.hospitalName,
    this.hospitalAddress,
    this.staffId,
    required this.doctorName,
    this.department,
    this.diagnosis,
    this.prescription,
    this.notes,
    this.visitDate,
  });

  factory MedicalRecordModel.fromJson(Map<String, dynamic> json) {
    // Handle nested Supabase join or flat FastAPI response
    final hospital = json['hospitals'] is Map ? json['hospitals'] as Map : null;
    final staff = json['hospital_staff'] is Map ? json['hospital_staff'] as Map : null;

    final hospitalName = (json['hospital_name'] ?? hospital?['name'] ?? 'Solapur Municipal Health Center').toString();
    final hospitalAddress = (json['hospital_address'] ?? hospital?['address'] ?? json['address'])?.toString();
    final doctorName = (json['doctor_name'] ?? staff?['name'] ?? 'Doctor').toString();
    final department = json['department']?.toString() ?? staff?['department']?.toString() ?? 'General Medicine';

    return MedicalRecordModel(
      recordId: (json['record_id'] ?? json['id'] ?? '').toString(),
      citizenId: (json['citizen_id'] ?? '').toString(),
      hospitalId: json['hospital_id']?.toString(),
      hospitalName: hospitalName,
      hospitalAddress: hospitalAddress,
      staffId: json['staff_id']?.toString(),
      doctorName: doctorName,
      department: department,
      diagnosis: json['diagnosis']?.toString(),
      prescription: json['prescription']?.toString(),
      notes: json['notes']?.toString(),
      visitDate: json['visit_date']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'record_id': recordId,
    'citizen_id': citizenId,
    'hospital_id': hospitalId,
    'hospital_name': hospitalName,
    'hospital_address': hospitalAddress,
    'staff_id': staffId,
    'doctor_name': doctorName,
    'department': department,
    'diagnosis': diagnosis,
    'prescription': prescription,
    'notes': notes,
    'visit_date': visitDate,
    'hospitals': {
      'name': hospitalName,
      'address': hospitalAddress ?? '',
    },
    'hospital_staff': {
      'name': doctorName,
      'department': department ?? 'General Medicine',
    },
  };
}
