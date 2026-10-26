class VaccinationRecordModel {
  final String recordId;
  final String citizenId;
  final String? hospitalId;
  final String hospitalName;
  final String? campaignId;
  final String vaccineType;
  final int doseNumber;
  final String? dateAdministered;

  VaccinationRecordModel({
    required this.recordId,
    required this.citizenId,
    this.hospitalId,
    required this.hospitalName,
    this.campaignId,
    required this.vaccineType,
    required this.doseNumber,
    this.dateAdministered,
  });

  factory VaccinationRecordModel.fromJson(Map<String, dynamic> json) {
    final hospital = json['hospitals'] is Map ? json['hospitals'] as Map : null;
    final hospitalName = (json['hospital_name'] ?? hospital?['name'] ?? 'Solapur Municipal Health Center').toString();

    final dose = json['dose_number'];
    final parsedDose = dose is int ? dose : int.tryParse(dose?.toString() ?? '1') ?? 1;

    return VaccinationRecordModel(
      recordId: (json['record_id'] ?? '').toString(),
      citizenId: (json['citizen_id'] ?? '').toString(),
      hospitalId: json['hospital_id']?.toString(),
      hospitalName: hospitalName,
      campaignId: json['campaign_id']?.toString(),
      vaccineType: (json['vaccine_type'] ?? 'Vaccine').toString(),
      doseNumber: parsedDose,
      dateAdministered: json['date_administered']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'record_id': recordId,
    'citizen_id': citizenId,
    'hospital_id': hospitalId,
    'hospital_name': hospitalName,
    'campaign_id': campaignId,
    'vaccine_type': vaccineType,
    'dose_number': doseNumber,
    'date_administered': dateAdministered,
  };
}
