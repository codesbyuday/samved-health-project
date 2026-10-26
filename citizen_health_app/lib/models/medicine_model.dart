class MedicineModel {
  final String medicineId;
  final String name;
  final String? category;
  final String? manufacturer;
  final double? unitPrice;
  final String? dosageForm;
  final String? strength;
  final int? quantity;
  final String? expiryDate;
  final bool isCritical;
  final String? pharmacyName;
  final String? pharmacyAddress;
  final String? pharmacyPhone;

  MedicineModel({
    required this.medicineId,
    required this.name,
    this.category,
    this.manufacturer,
    this.unitPrice,
    this.dosageForm,
    this.strength,
    this.quantity,
    this.expiryDate,
    this.isCritical = false,
    this.pharmacyName,
    this.pharmacyAddress,
    this.pharmacyPhone,
  });

  bool get isAvailable => (quantity ?? 1) > 0;

  factory MedicineModel.fromJson(Map<String, dynamic> json) {
    return MedicineModel(
      medicineId: (json['medicine_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? json['medicine_name'] ?? 'Medicine').toString(),
      category: (json['category'] ?? json['medicine_category'])?.toString(),
      manufacturer: (json['manufacturer'] ?? json['manufacturer_name'])?.toString(),
      unitPrice: json['unit_price'] != null ? double.tryParse(json['unit_price'].toString()) : null,
      dosageForm: json['dosage_form']?.toString(),
      strength: json['strength']?.toString(),
      quantity: json['quantity'] is int ? json['quantity'] : int.tryParse(json['quantity']?.toString() ?? ''),
      expiryDate: json['expiry_date']?.toString(),
      isCritical: json['is_critical'] == true,
      pharmacyName: json['pharmacy_name']?.toString() ?? json['hospital_name']?.toString(),
      pharmacyAddress: json['address']?.toString(),
      pharmacyPhone: json['phone']?.toString(),
    );
  }
}
