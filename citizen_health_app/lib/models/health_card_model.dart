import 'citizen_model.dart';

class HealthCardModel {
  final String cardNumber;
  final CitizenModel citizen;
  final String issuedBy;
  final String qrCodeData;
  final String status;

  HealthCardModel({
    required this.cardNumber,
    required this.citizen,
    required this.issuedBy,
    required this.qrCodeData,
    required this.status,
  });

  factory HealthCardModel.fromJson(Map<String, dynamic> json) {
    final citizenJson = json['citizen'] is Map<String, dynamic>
        ? json['citizen'] as Map<String, dynamic>
        : <String, dynamic>{};

    return HealthCardModel(
      cardNumber: (json['card_number'] ?? '').toString(),
      citizen: CitizenModel.fromJson(citizenJson),
      issuedBy: (json['issued_by'] ?? 'Solapur Municipal Corporation').toString(),
      qrCodeData: (json['qr_code_data'] ?? '').toString(),
      status: (json['status'] ?? 'Active').toString(),
    );
  }
}
