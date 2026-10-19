class DoctorModel {
  final String staffUuid;
  final String name;
  final String? department;
  final String? specialization;
  final int? consultationTime;
  final String? workStartTime;
  final String? workEndTime;
  final String? breakStartTime;
  final String? breakEndTime;
  final int? maxPatientsPerDay;
  final String? phone;
  final String? hospitalId;
  final String? hospitalName;

  DoctorModel({
    required this.staffUuid,
    required this.name,
    this.department,
    this.specialization,
    this.consultationTime,
    this.workStartTime,
    this.workEndTime,
    this.breakStartTime,
    this.breakEndTime,
    this.maxPatientsPerDay,
    this.phone,
    this.hospitalId,
    this.hospitalName,
  });

  factory DoctorModel.fromJson(Map<String, dynamic> json) {
    return DoctorModel(
      staffUuid: (json['staff_uuid'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? 'Doctor').toString(),
      department: json['department']?.toString(),
      specialization: json['specialization']?.toString() ?? json['department']?.toString(),
      consultationTime: json['consultation_time'] is int
          ? json['consultation_time']
          : int.tryParse(json['consultation_time']?.toString() ?? ''),
      workStartTime: json['work_start_time']?.toString(),
      workEndTime: json['work_end_time']?.toString(),
      breakStartTime: json['break_start_time']?.toString(),
      breakEndTime: json['break_end_time']?.toString(),
      maxPatientsPerDay: json['max_patients_per_day'] is int
          ? json['max_patients_per_day']
          : int.tryParse(json['max_patients_per_day']?.toString() ?? ''),
      phone: json['phone']?.toString(),
      hospitalId: json['hospital_id']?.toString(),
      hospitalName: json['hospital_name']?.toString(),
    );
  }
}
