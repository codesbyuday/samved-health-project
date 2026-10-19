class AppointmentModel {
  final String appointmentId;
  final String citizenId;
  final String hospitalId;
  final String? doctorId;
  final String? appointmentType;
  final String appointmentDate;
  final String timeSlot;
  final int? tokenId;
  final String status;
  final String? createdAt;
  final String? doctorName;
  final String? hospitalName;

  AppointmentModel({
    required this.appointmentId,
    required this.citizenId,
    required this.hospitalId,
    this.doctorId,
    this.appointmentType,
    required this.appointmentDate,
    required this.timeSlot,
    this.tokenId,
    required this.status,
    this.createdAt,
    this.doctorName,
    this.hospitalName,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      appointmentId: (json['appointment_id'] ?? json['id'] ?? '').toString(),
      citizenId: (json['citizen_id'] ?? '').toString(),
      hospitalId: (json['hospital_id'] ?? '').toString(),
      doctorId: json['doctor_id']?.toString(),
      appointmentType: json['appointment_type']?.toString(),
      appointmentDate: (json['appointment_date'] ?? '').toString(),
      timeSlot: (json['time_slot'] ?? '').toString(),
      tokenId: json['token_id'] is int ? json['token_id'] : int.tryParse(json['token_id']?.toString() ?? ''),
      status: (json['status'] ?? 'scheduled').toString(),
      createdAt: json['created_at']?.toString(),
      doctorName: json['doctor_name']?.toString() ?? json['doctor']?['name']?.toString(),
      hospitalName: json['hospital_name']?.toString() ?? json['hospital']?['name']?.toString(),
    );
  }
}
